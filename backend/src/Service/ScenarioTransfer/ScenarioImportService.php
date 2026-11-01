<?php declare(strict_types=1);

namespace App\Service\ScenarioTransfer;

use App\Entity\Move;
use App\Entity\Scenario;
use App\Entity\ScenarioCell;
use App\Entity\ScenarioColumn;
use App\Entity\ScenarioRow;
use App\Entity\User;
use App\Service\AggregatedDefenseCatalogService;
use App\Service\ModerationTransitionService;
use App\Service\ResolveScenarioDynamicComboCellsService;
use App\Service\ScenarioComboContextService;
use App\Service\ScenarioExecutionModeService;
use App\Service\ScenarioLinkedComponentSolveService;
use App\Service\ScenarioMatrixMapper;
use App\Service\ScenarioSavedSolutionService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Uid\Uuid;

/**
 * Imports scenario_export_v1 documents. Scenarios are matched on their export key, so a re-import updates instead of
 * duplicating. Re-import policy: a stored scenario whose current content differs from what its last import wrote
 * (it was edited on the site), or that was never imported (created on the site), is a conflict. Conflicts refuse the
 * whole import unless overwriteSiteEdits is set. Nothing is written while any starter is unresolved.
 *
 * @phpstan-import-type ResolvedScenario from ScenarioImportResolver
 * @phpstan-import-type ParsedStarter from ScenarioImportDocumentValidator
 */
final class ScenarioImportService
{
    public const STATUS_OK = 'ok';
    public const STATUS_INVALID = 'invalid';
    public const STATUS_UNRESOLVED_STARTERS = 'unresolved_starters';
    public const STATUS_CONFLICT = 'conflict';

    public const ACTION_CREATE = 'create';
    public const ACTION_UPDATE = 'update';
    public const ACTION_UNCHANGED = 'unchanged';
    public const ACTION_CONFLICT = 'conflict';

    public function __construct(
        private readonly ScenarioImportDocumentValidator $documentValidator,
        private readonly ScenarioImportResolver $resolver,
        private readonly ScenarioImportStarterCheckService $starterCheckService,
        private readonly ScenarioExportService $exportService,
        private readonly ScenarioMatrixMapper $scenarioMatrixMapper,
        private readonly ScenarioComboContextService $scenarioComboContextService,
        private readonly AggregatedDefenseCatalogService $aggregatedDefenseCatalogService,
        private readonly ResolveScenarioDynamicComboCellsService $resolveScenarioDynamicComboCellsService,
        private readonly ScenarioSavedSolutionService $scenarioSavedSolutionService,
        private readonly ScenarioLinkedComponentSolveService $linkedComponentSolveService,
        private readonly ModerationTransitionService $moderationTransitionService,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * Validates and resolves without writing anything.
     *
     * @param array<mixed> $document
     *
     * @return array<string, mixed>
     */
    public function dryRun(array $document, bool $overwriteSiteEdits = false): array
    {
        return $this->plan($document, $overwriteSiteEdits)['report'];
    }

    /**
     * Reference cells are re-solved with their whole linked component (self-links and cycles included) after the
     * write; linkConvergence in the result reports how much each linked scenario's EV still moved on the last pass.
     *
     * @param array<mixed> $document
     *
     * @return array<string, mixed>
     */
    public function import(array $document, ?User $actor, bool $overwriteSiteEdits = false, ?int $linkPasses = null): array
    {
        $plan = $this->plan($document, $overwriteSiteEdits);
        if (self::STATUS_OK !== $plan['report']['status']) {
            return $plan['report'] + ['imported' => false];
        }

        [$scenarios, $linkConvergence] = $this->entityManager->getConnection()->transactional(
            fn (): array => $this->write($plan['scenarios'], $plan['report']['scenarios'], $actor, $linkPasses)
        );

        $results = [];
        foreach ($plan['report']['scenarios'] as $index => $entry) {
            $scenario = $scenarios[$index];
            $results[] = [
                'key' => $entry['key'],
                'name' => $entry['name'],
                'action' => $entry['action'],
                'id' => $scenario->getPublicId()->toRfc4122(),
                'url' => sprintf('/scenarios/%s', $scenario->getPublicId()->toRfc4122()),
                'moderationState' => $scenario->getModerationState(),
                'layerExpectedValues' => $this->layerExpectedValues($scenario),
            ];
        }

        return array_merge($plan['report'], ['imported' => true, 'scenarios' => $results, 'linkConvergence' => $linkConvergence]);
    }

    /**
     * @param array<mixed> $document
     *
     * @return array{report:array<string,mixed>,scenarios:list<ResolvedScenario>}
     */
    private function plan(array $document, bool $overwriteSiteEdits): array
    {
        $validation = $this->documentValidator->validate($document);
        if ([] !== $validation['errors']) {
            return ['report' => $this->report(self::STATUS_INVALID, $validation['errors'], []), 'scenarios' => []];
        }

        $resolution = $this->resolver->resolve($validation['scenarios']);
        if ([] !== $resolution['errors']) {
            return ['report' => $this->report(self::STATUS_INVALID, $resolution['errors'], []), 'scenarios' => []];
        }

        $entries = [];
        $hasUnresolved = false;
        $hasConflict = false;
        foreach ($resolution['scenarios'] as $scenario) {
            $dynamicCells = $this->starterCheckService->check($scenario);
            $unresolved = array_values(array_filter($dynamicCells, static fn (array $cell): bool => !$cell['resolved']));
            [$action, $conflict] = $this->decideAction($scenario, $overwriteSiteEdits);
            $hasUnresolved = $hasUnresolved || [] !== $unresolved;
            $hasConflict = $hasConflict || self::ACTION_CONFLICT === $action;

            $entries[] = [
                'key' => $scenario['parsed']['key'],
                'name' => $scenario['parsed']['name'],
                'action' => $action,
                'conflict' => $conflict,
                'id' => $scenario['existing']?->getPublicId()->toRfc4122(),
                'unresolvedStarters' => array_map(static fn (array $cell): string => $cell['path'], $unresolved),
                'dynamicCells' => $dynamicCells,
            ];
        }

        $status = match (true) {
            $hasUnresolved => self::STATUS_UNRESOLVED_STARTERS,
            $hasConflict => self::STATUS_CONFLICT,
            default => self::STATUS_OK,
        };

        return ['report' => $this->report($status, [], $entries), 'scenarios' => $resolution['scenarios']];
    }

    /**
     * @param ResolvedScenario $scenario
     *
     * @return array{0:string,1:string|null}
     */
    private function decideAction(array $scenario, bool $overwriteSiteEdits): array
    {
        $existing = $scenario['existing'];
        if (null === $existing) {
            return [self::ACTION_CREATE, null];
        }

        $currentHash = ScenarioExportFormat::contentHash($this->exportService->exportScenario($existing));
        $conflict = match (true) {
            null === $existing->getImportContentHash() => 'The scenario was not created by an import, so its site state has no import baseline.',
            $currentHash !== $existing->getImportContentHash() => 'The scenario was edited on the site since its last import.',
            default => null,
        };

        if (null !== $conflict && !$overwriteSiteEdits) {
            return [self::ACTION_CONFLICT, $conflict];
        }

        if (null === $conflict && $currentHash === ScenarioExportFormat::contentHash($this->canonicalPayload($scenario))) {
            return [self::ACTION_UNCHANGED, null];
        }

        return [self::ACTION_UPDATE, $conflict];
    }

    /**
     * @param list<string> $errors
     * @param list<array<string, mixed>> $scenarios
     *
     * @return array<string, mixed>
     */
    private function report(string $status, array $errors, array $scenarios): array
    {
        return [
            'format' => ScenarioExportFormat::FORMAT,
            'status' => $status,
            'errors' => $errors,
            'scenarios' => $scenarios,
        ];
    }

    /**
     * @param list<ResolvedScenario> $resolvedScenarios
     * @param list<array<string, mixed>> $entries
     *
     * @return array{0:list<Scenario>,1:array<string,mixed>}
     */
    private function write(array $resolvedScenarios, array $entries, ?User $actor, ?int $linkPasses): array
    {
        $scenarios = [];
        $publicIdsByKey = [];
        foreach ($resolvedScenarios as $index => $resolved) {
            $scenario = $resolved['existing'] ?? $this->createScenario($resolved, $actor);
            if (self::ACTION_UNCHANGED !== $entries[$index]['action']) {
                $this->applyScenarioFields($scenario, $resolved);
            }
            $scenarios[$index] = $scenario;
            $publicIdsByKey[$this->resolver->keyString($resolved['parsed']['key'])] = $scenario->getPublicId()->toRfc4122();
        }
        $this->entityManager->flush();

        foreach ($resolvedScenarios as $index => $resolved) {
            if (self::ACTION_UNCHANGED !== $entries[$index]['action']) {
                $this->applyMatrix($scenarios[$index], $resolved, $publicIdsByKey);
            }
        }
        $this->entityManager->flush();

        // Unchanged scenarios are seeds too: a linked scenario elsewhere in their component may have changed.
        $linkConvergence = $this->linkedComponentSolveService->solveAndStore(array_values($scenarios), $linkPasses);
        $this->entityManager->flush();

        foreach ($scenarios as $scenario) {
            $scenario->setImportContentHash(ScenarioExportFormat::contentHash($this->exportService->exportScenario($scenario)));
        }
        $this->entityManager->flush();

        return [$scenarios, $linkConvergence];
    }

    /**
     * @param ResolvedScenario $resolved
     */
    private function createScenario(array $resolved, ?User $actor): Scenario
    {
        $key = $resolved['parsed']['key'];
        $scenario = (new Scenario())
            ->setImportKey($key['source'], $key['externalId'])
            ->setAuthor($actor);
        if (ScenarioExportFormat::SITE_SOURCE === $key['source'] && Uuid::isValid($key['externalId'])) {
            $scenario->setPublicId(Uuid::fromString($key['externalId']));
        }
        $this->entityManager->persist($scenario);

        return $scenario;
    }

    /**
     * @param ResolvedScenario $resolved
     */
    private function applyScenarioFields(Scenario $scenario, array $resolved): void
    {
        $parsed = $resolved['parsed'];
        $scenario
            ->setImportKey($parsed['key']['source'], $parsed['key']['externalId'])
            ->setName($parsed['name'])
            ->setScenarioType($parsed['scenarioType'])
            ->setIsEssential($parsed['isEssential'])
            ->setAttackerCharacter($resolved['attacker'])
            ->setDefenderCharacter($resolved['defender'])
            ->setTriggerMove($resolved['triggerMove'])
            ->setKnockdownAdvantage($parsed['situation']['knockdownAdvantage']);
    }

    /**
     * Writes through the same mapper, combo context, dynamic resolution and layer solving as the scenario editor.
     *
     * @param ResolvedScenario $resolved
     * @param array<string, string> $publicIdsByKey
     */
    private function applyMatrix(Scenario $scenario, array $resolved, array $publicIdsByKey): void
    {
        $this->scenarioSavedSolutionService->releaseAxisReferences($scenario);
        $this->scenarioComboContextService->hydrateScenarioContext($scenario, ['comboContext' => [
            'positionLock' => $resolved['parsed']['situation']['position'],
            'characterStatuses' => array_map(
                static fn (array $status): array => ['object_name' => $status['object_name'], 'status_required' => $status['status_required']],
                $resolved['characterStatuses']
            ),
        ]]);

        $matrix = $this->buildMatrixPayload($resolved, $publicIdsByKey);
        if ($this->aggregatedDefenseCatalogService->isAggregatedScenarioType($scenario->getScenarioType())) {
            $matrix = $this->aggregatedDefenseCatalogService->normalizeAggregatedMatrix($matrix);
        }
        $this->scenarioMatrixMapper->replaceScenarioMatrixFromPayload($scenario, $matrix);
        $this->applyAnnotations($scenario, $resolved);

        $this->resolveScenarioDynamicComboCellsService->resolveForScenario(
            $scenario,
            null,
            ScenarioExecutionModeService::MODE_STANDARD,
            null,
            null,
            $this->scenarioComboContextService->buildEffectiveContext($scenario, [])
        );
        $this->moderationTransitionService->submitScenarioForReview($scenario);
    }

    /**
     * @param ResolvedScenario $resolved
     * @param array<string, string> $publicIdsByKey
     *
     * @return array<string, mixed>
     */
    private function buildMatrixPayload(array $resolved, array $publicIdsByKey): array
    {
        $parsed = $resolved['parsed'];
        $requirements = static fn (array $item): array => array_map(
            static fn (array $requirement): array => $requirement + ['operator' => '>='],
            $item['requirements']
        );
        $summary = static fn (array $item): array => ['cellType' => 'summary', 'value' => $item['summaryValue']];

        $cells = [];
        foreach (array_keys($parsed['rows']) as $rowIndex) {
            foreach (array_keys($parsed['columns']) as $columnIndex) {
                $cell = $parsed['cells'][$rowIndex][$columnIndex];
                $cells[$rowIndex][$columnIndex] = $this->buildCellPayload($cell, $resolved['starters'][$cell['path']] ?? null, $publicIdsByKey);
            }
        }

        return [
            'kind' => 'matrix-editor',
            'schemaVersion' => 1,
            'axes' => [
                'rows' => array_column($parsed['rows'], 'label'),
                'columns' => array_column($parsed['columns'], 'label'),
                'rowLayers' => array_column($parsed['rows'], 'layer'),
                'columnLayers' => array_column($parsed['columns'], 'layer'),
                'rowRequirements' => array_map($requirements, $parsed['rows']),
                'columnRequirements' => array_map($requirements, $parsed['columns']),
            ],
            'cells' => $cells,
            'summary' => [
                'rowAxis' => array_map($summary, $parsed['rows']),
                'columnAxis' => array_map($summary, $parsed['columns']),
            ],
        ];
    }

    /**
     * @param array<string, mixed> $cell
     * @param array{moves:list<Move>,hitCondition:string,initiator:string}|null $starter
     * @param array<string, string> $publicIdsByKey
     *
     * @return array<string, mixed>
     */
    private function buildCellPayload(array $cell, ?array $starter, array $publicIdsByKey): array
    {
        if (ScenarioCell::KIND_DYNAMIC_COMBO === $cell['kind'] && null !== $starter) {
            return ['cellType' => 'dynamic_combo', 'dynamicCombo' => $this->dynamicComboPayload($starter)];
        }

        if (ScenarioCell::KIND_REFERENCE === $cell['kind']) {
            $reference = $cell['reference'];
            $referenced = $reference['scenario'];
            $preValue = match (true) {
                null !== $starter => ['kind' => 'dynamic_combo', 'dynamicCombo' => $this->dynamicComboPayload($starter)],
                null !== $reference['preValue'] => ['kind' => 'static', 'staticValue' => $reference['preValue']['value']],
                default => ['kind' => 'none'],
            };

            return [
                'cellType' => 'reference',
                'value' => $reference['cachedValue'],
                'metadata' => [
                    'scenarioId' => $publicIdsByKey[$this->resolver->keyString($referenced)]
                        ?? $this->resolver->findExisting($referenced)?->getPublicId()->toRfc4122(),
                    'referenceKind' => $reference['mode'],
                    'weight' => $reference['weight'],
                    'perspective' => $reference['perspective'],
                    'cachedValue' => $reference['cachedValue'],
                    'preValue' => $preValue,
                ],
            ];
        }

        return ['cellType' => 'value', 'value' => $cell['value']];
    }

    /**
     * @param array{moves:list<Move>,hitCondition:string,initiator:string} $starter
     *
     * @return array<string, mixed>
     */
    private function dynamicComboPayload(array $starter): array
    {
        $hitCondition = $starter['hitCondition'];

        return [
            'isComboInitiatorAttacker' => 'attacker' === $starter['initiator'],
            'starterMoveIds' => array_map(static fn (Move $move): string => (string) $move->getId(), $starter['moves']),
            'starterContext' => [
                'isPunishCounter' => in_array($hitCondition, ['punish_counter', 'perfect_parry'], true),
                'isCounterHit' => 'counter_hit' === $hitCondition,
                'isPerfectParry' => 'perfect_parry' === $hitCondition,
            ],
        ];
    }

    /**
     * The editor payload carries no descriptions, seen stats or provenance, so they are set on the rebuilt rows,
     * columns and cells by position.
     *
     * @param ResolvedScenario $resolved
     */
    private function applyAnnotations(Scenario $scenario, array $resolved): void
    {
        $parsed = $resolved['parsed'];
        foreach ($scenario->getRows() as $row) {
            $item = $parsed['rows'][$row->getPosition()];
            $row->setDescription($item['description'])->setSeenStats($item['stats']['seenFrequency'] ?? null, $item['stats']['sampleCount'] ?? null);
        }
        foreach ($scenario->getColumns() as $column) {
            $item = $parsed['columns'][$column->getPosition()];
            $column->setDescription($item['description'])->setSeenStats($item['stats']['seenFrequency'] ?? null, $item['stats']['sampleCount'] ?? null);
        }
        foreach ($scenario->getCells() as $cell) {
            $provenance = $parsed['cells'][(int) $cell->getRow()?->getPosition()][(int) $cell->getColumn()?->getPosition()]['provenance'];
            $cell->setProvenance($provenance['status'] ?? null, $provenance['sampleCount'] ?? null, $provenance['confidence'] ?? null, $provenance['note'] ?? null);
        }
    }

    /**
     * The incoming scenario in exactly the shape ScenarioExportService produces, to detect a re-import that changes nothing.
     *
     * @param ResolvedScenario $resolved
     *
     * @return array<string, mixed>
     */
    private function canonicalPayload(array $resolved): array
    {
        $parsed = $resolved['parsed'];
        $rowKeys = ScenarioExportFormat::axisKeys(array_column($parsed['rows'], 'label'), 'row');
        $columnKeys = ScenarioExportFormat::axisKeys(array_column($parsed['columns'], 'label'), 'column');

        $statuses = array_map(
            static fn (array $status): array => ['object' => $status['object_key'] ?? $status['object_name'], 'status' => $status['status_required']],
            $resolved['characterStatuses']
        );
        usort($statuses, static fn (array $a, array $b): int => $a['object'] <=> $b['object']);

        $cells = [];
        foreach ($rowKeys as $rowIndex => $rowKey) {
            foreach ($columnKeys as $columnIndex => $columnKey) {
                $cell = $parsed['cells'][$rowIndex][$columnIndex];
                $cells[] = $this->canonicalCell($cell, $rowKey, $columnKey, $resolved['starters'][$cell['path']] ?? null);
            }
        }

        $axis = static fn (array $items, array $keys): array => array_map(
            static fn (array $item, string $key): array => [
                'key' => $key,
                'label' => $item['label'],
                'description' => $item['description'],
                'layer' => $item['layer'],
                'requirements' => $item['requirements'],
                'summaryValue' => $item['summaryValue'],
            ] + (null === $item['stats'] ? [] : ['stats' => $item['stats']]),
            $items,
            $keys
        );

        return [
            'key' => $parsed['key'],
            'name' => $parsed['name'],
            'scenarioType' => $parsed['scenarioType'],
            'isEssential' => $parsed['isEssential'],
            'attacker' => $resolved['attacker']->getName(),
            'defender' => $resolved['defender']->getName(),
            'situation' => [
                'triggerMove' => [
                    'character' => $resolved['triggerMove']->getCharacter()->getName(),
                    'notation' => $resolved['triggerMove']->getNumpadNotation(),
                ],
                'position' => $parsed['situation']['position'],
                'knockdownAdvantage' => $parsed['situation']['knockdownAdvantage'],
                'characterStatuses' => $statuses,
            ],
            'rows' => $axis($parsed['rows'], $rowKeys),
            'columns' => $axis($parsed['columns'], $columnKeys),
            'cells' => $cells,
        ];
    }

    /**
     * @param array<string, mixed> $cell
     * @param array{moves:list<Move>,hitCondition:string,initiator:string}|null $starter
     *
     * @return array<string, mixed>
     */
    private function canonicalCell(array $cell, string $rowKey, string $columnKey, ?array $starter): array
    {
        $payload = ['row' => $rowKey, 'column' => $columnKey, 'kind' => $cell['kind']];
        $canonicalStarter = null;
        if (null !== $starter) {
            $moves = array_map(static fn (Move $move): string => $move->getNumpadNotation(), $starter['moves']);
            sort($moves);
            $canonicalStarter = ['initiator' => $starter['initiator'], 'moves' => $moves, 'hitCondition' => $starter['hitCondition']];
        }

        if (ScenarioCell::KIND_STATIC === $cell['kind']) {
            $payload['value'] = $cell['value'];
        } elseif (ScenarioCell::KIND_DYNAMIC_COMBO === $cell['kind']) {
            $payload['starter'] = $canonicalStarter;
        } else {
            $reference = $cell['reference'];
            $preValue = match (true) {
                null !== $canonicalStarter => ['kind' => ScenarioCell::KIND_DYNAMIC_COMBO, 'starter' => $canonicalStarter],
                null !== $reference['preValue'] => ['kind' => ScenarioCell::KIND_STATIC, 'value' => $reference['preValue']['value']],
                default => null,
            };
            $payload['reference'] = ScenarioExportFormat::referencePayload($reference['scenario'], $reference['mode'], $reference['weight'], $reference['perspective'], $reference['cachedValue'], $preValue);
        }

        if (null !== $cell['provenance']) {
            $payload['provenance'] = $cell['provenance'];
        }

        return $payload;
    }

    /**
     * @return array<int, float|null>
     */
    private function layerExpectedValues(Scenario $scenario): array
    {
        $values = [];
        foreach ($scenario->getLayerSolutions() as $solution) {
            $values[$solution->getLayer()] = $solution->getExpectedValue();
        }
        ksort($values);

        return $values;
    }
}
