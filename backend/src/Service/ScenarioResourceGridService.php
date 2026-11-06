<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Character;
use App\Entity\CharacterObject;
use App\Entity\Scenario;
use App\Entity\ScenarioColumn;
use App\Entity\ScenarioComboContext;
use App\Entity\ScenarioResourceGrid;
use App\Entity\ScenarioResourceGridAxes;
use App\Entity\ScenarioResourceGridProbability;
use App\Entity\ScenarioResourceGridSolution;
use App\Entity\ScenarioRow;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Uid\Uuid;

/**
 * Precomputes a scenario's linked equilibrium for every resource combination of its grid, with options whose
 * resource requirements are not met left out, and serves it to the resource explorer. Uses the standard execution
 * mode, like the saved layer solutions anonymous visitors see.
 *
 * Grids also move between environments as scenario_resource_grid_v1 documents, so production can load grids solved
 * elsewhere instead of solving them itself.
 */
class ScenarioResourceGridService
{
    public const EXPORT_FORMAT = 'scenario_resource_grid_v1';
    private const PROBABILITY_DECIMALS = 4;
    private const EXPECTED_VALUE_DECIMALS = 1;

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly ScenarioLinkedExpectedValueResolverService $resolver,
        private readonly ScenarioAliasService $aliasService,
    ) {
    }

    /**
     * Solves every combination and replaces the scenario's stored grid.
     */
    public function computeAndStore(Scenario $scenario): ScenarioResourceGrid
    {
        $attackerObject = $this->findObject($scenario->getAttackerCharacter());
        $defenderObject = $this->findObject($scenario->getDefenderCharacter());
        $axes = new ScenarioResourceGridAxes(
            $attackerObject?->getObjectKey(),
            $this->objectMax($attackerObject),
            $defenderObject?->getObjectKey(),
            $this->objectMax($defenderObject),
            ScenarioComboContext::POSITION_VIEWER_DEFAULT_MIDSCREEN === ($scenario->getComboContext()?->getPositionLock() ?? ScenarioComboContext::POSITION_VIEWER_DEFAULT_MIDSCREEN),
        );
        $grid = new ScenarioResourceGrid($scenario, $axes, new \DateTimeImmutable());
        $attackerLife = (float) ($scenario->getAttackerCharacter()?->getLife() ?? 10000);
        $defenderLife = (float) ($scenario->getDefenderCharacter()?->getLife() ?? 10000);

        $solutionPositionByKey = [];
        $previousPosition = null;
        foreach ($axes->combinations() as $index => $combination) {
            $result = $this->resolver->resolve($scenario, null, ScenarioExecutionModeService::MODE_STANDARD, null, [
                'attacker' => $this->playerContext($combination['attacker'], $attackerLife, $attackerObject),
                'defender' => $this->playerContext($combination['defender'], $defenderLife, $defenderObject),
            ], ['comboContext' => ['includeCornerSpecific' => $combination['includeCornerSpecific']]]);

            $solution = $this->roundSolution($result);
            $key = md5(serialize($solution));
            if (!isset($solutionPositionByKey[$key])) {
                $solutionPositionByKey[$key] = count($solutionPositionByKey);
                $grid->addSolution($this->buildSolution($solutionPositionByKey[$key], $solution));
            }

            if ($solutionPositionByKey[$key] !== $previousPosition) {
                $grid->addRun($index, $solutionPositionByKey[$key]);
                $previousPosition = $solutionPositionByKey[$key];
            }
        }

        $this->replace($scenario, $grid);

        return $grid;
    }

    public function findFor(Scenario $scenario): ?ScenarioResourceGrid
    {
        return $this->entityManager->getRepository(ScenarioResourceGrid::class)->findOneBy(['scenario' => $scenario]);
    }

    /**
     * Axes, distinct solutions by row and column position, and runs as [startIndex, solutionPosition] pairs.
     *
     * @return array<string, mixed>
     */
    public function buildPayload(ScenarioResourceGrid $grid): array
    {
        $scenario = $grid->getScenario();
        $axes = $grid->getAxes();

        return [
            'scenarioId' => $scenario->getPublicId()->toRfc4122(),
            'computedAt' => $grid->getComputedAt()->format(\DATE_ATOM),
            'axes' => [
                'driveStep' => ScenarioResourceGridAxes::DRIVE_STEP,
                'driveMax' => ScenarioResourceGridAxes::DRIVE_MAX,
                'superMax' => ScenarioResourceGridAxes::SUPER_MAX,
                'cornerToggle' => $axes->cornerToggle,
                'attackerObject' => $this->objectPayload($axes->attackerObjectKey, $axes->attackerObjectMax),
                'defenderObject' => $this->objectPayload($axes->defenderObjectKey, $axes->defenderObjectMax),
            ],
            'solutions' => $this->solutionsPayload($grid),
            'runs' => $this->runsPayload($grid),
        ];
    }

    /**
     * @param list<ScenarioResourceGrid> $grids
     *
     * @return array<string, mixed>
     */
    public function exportDocument(array $grids): array
    {
        return [
            'format' => self::EXPORT_FORMAT,
            'exportedAt' => (new \DateTimeImmutable())->format(\DATE_ATOM),
            'grids' => array_map(fn (ScenarioResourceGrid $grid): array => $this->exportEntry($grid), $grids),
        ];
    }

    /**
     * Stores every grid of a scenario_resource_grid_v1 document on the matching local scenario: the same import key,
     * else the same public id, else the same alias. A grid is skipped when its scenario is missing or its options
     * differ from the local scenario's. Grids count as computed at import time, and their alias is set locally.
     *
     * @param array<mixed> $document
     *
     * @return array{imported:list<string>,skipped:list<string>}
     */
    public function importDocument(array $document, bool $dryRun = false): array
    {
        if (self::EXPORT_FORMAT !== ($document['format'] ?? null) || !is_array($document['grids'] ?? null)) {
            throw new \InvalidArgumentException(sprintf('Not a %s document.', self::EXPORT_FORMAT));
        }

        $report = ['imported' => [], 'skipped' => []];
        foreach ($document['grids'] as $entry) {
            $label = is_array($entry) && is_string($entry['scenario']['name'] ?? null) ? $entry['scenario']['name'] : 'Unnamed grid';
            try {
                if (!is_array($entry)) {
                    throw new \InvalidArgumentException('Malformed grid entry.');
                }
                $scenario = $this->matchScenario($entry);
                $grid = $this->buildImportedGrid($scenario, $entry);
                if (!$dryRun) {
                    $alias = is_string($entry['alias'] ?? null) ? $entry['alias'] : null;
                    $this->entityManager->wrapInTransaction(function () use ($scenario, $grid, $alias): void {
                        if (null !== $alias) {
                            $this->aliasService->assign($scenario, $alias);
                        }
                        $this->replace($scenario, $grid);
                    });
                }
                $report['imported'][] = sprintf('%s (%d solutions, %d runs)', $scenario->getName(), $grid->getSolutions()->count(), $grid->getRuns()->count());
            } catch (\InvalidArgumentException $exception) {
                $report['skipped'][] = sprintf('%s: %s', $label, $exception->getMessage());
            }
        }

        return $report;
    }

    /**
     * Swaps the stored grid in one transaction, so readers see the old grid until the new one is complete.
     */
    private function replace(Scenario $scenario, ScenarioResourceGrid $grid): void
    {
        $this->entityManager->wrapInTransaction(function () use ($scenario, $grid): void {
            $existing = $this->findFor($scenario);
            if (null !== $existing) {
                $this->entityManager->remove($existing);
                $this->entityManager->flush();
            }
            $this->entityManager->persist($grid);
            $this->entityManager->flush();
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function exportEntry(ScenarioResourceGrid $grid): array
    {
        $scenario = $grid->getScenario();
        $axes = $grid->getAxes();

        return [
            'alias' => $this->aliasService->findAlias($scenario),
            'scenario' => [
                'publicId' => $scenario->getPublicId()->toRfc4122(),
                'importSource' => $scenario->getImportSource(),
                'importExternalId' => $scenario->getImportExternalId(),
                'importContentHash' => $scenario->getImportContentHash(),
                'name' => $scenario->getName(),
                'rowLabels' => $this->axisLabels($scenario->getRows()->toArray()),
                'columnLabels' => $this->axisLabels($scenario->getColumns()->toArray()),
            ],
            'computedAt' => $grid->getComputedAt()->format(\DATE_ATOM),
            'axes' => [
                'attackerObjectKey' => $axes->attackerObjectKey,
                'attackerObjectMax' => $axes->attackerObjectMax,
                'defenderObjectKey' => $axes->defenderObjectKey,
                'defenderObjectMax' => $axes->defenderObjectMax,
                'cornerToggle' => $axes->cornerToggle,
            ],
            'solutions' => $this->solutionsPayload($grid),
            'runs' => $this->runsPayload($grid),
        ];
    }

    /**
     * @param array<mixed> $entry
     */
    private function matchScenario(array $entry): Scenario
    {
        $reference = is_array($entry['scenario'] ?? null) ? $entry['scenario'] : [];
        $repository = $this->entityManager->getRepository(Scenario::class);
        $scenario = null;
        if (is_string($reference['importSource'] ?? null) && is_string($reference['importExternalId'] ?? null)) {
            $scenario = $repository->findOneBy(['importSource' => $reference['importSource'], 'importExternalId' => $reference['importExternalId']]);
        }
        if (null === $scenario && is_string($reference['publicId'] ?? null) && Uuid::isValid($reference['publicId'])) {
            $scenario = $repository->findOneBy(['publicId' => Uuid::fromString($reference['publicId'])]);
        }
        if (null === $scenario && is_string($entry['alias'] ?? null)) {
            $scenario = $this->aliasService->findScenario($entry['alias']);
        }
        if (!$scenario instanceof Scenario) {
            throw new \InvalidArgumentException('no matching scenario here; import the scenario first.');
        }

        $sameOptions = ($reference['rowLabels'] ?? null) === $this->axisLabels($scenario->getRows()->toArray())
            && ($reference['columnLabels'] ?? null) === $this->axisLabels($scenario->getColumns()->toArray());
        $exportedHash = $reference['importContentHash'] ?? null;
        $localHash = $scenario->getImportContentHash();
        if (!$sameOptions || (is_string($exportedHash) && null !== $localHash && $exportedHash !== $localHash)) {
            throw new \InvalidArgumentException('the scenario here differs from the one the grid was solved for; import the same version first.');
        }

        return $scenario;
    }

    /**
     * @param array<mixed> $entry
     */
    private function buildImportedGrid(Scenario $scenario, array $entry): ScenarioResourceGrid
    {
        $axesData = is_array($entry['axes'] ?? null) ? $entry['axes'] : [];
        $axes = new ScenarioResourceGridAxes(
            is_string($axesData['attackerObjectKey'] ?? null) ? $axesData['attackerObjectKey'] : null,
            max(0, (int) ($axesData['attackerObjectMax'] ?? 0)),
            is_string($axesData['defenderObjectKey'] ?? null) ? $axesData['defenderObjectKey'] : null,
            max(0, (int) ($axesData['defenderObjectMax'] ?? 0)),
            true === ($axesData['cornerToggle'] ?? false),
        );
        $grid = new ScenarioResourceGrid($scenario, $axes, new \DateTimeImmutable());

        $rowCount = $scenario->getRows()->count();
        $columnCount = $scenario->getColumns()->count();
        $solutions = is_array($entry['solutions'] ?? null) ? array_values($entry['solutions']) : [];
        foreach ($solutions as $position => $solution) {
            if (!is_array($solution) || !is_array($solution['rowAxis'] ?? null) || !is_array($solution['columnAxis'] ?? null)
                || count($solution['rowAxis']) !== $rowCount || count($solution['columnAxis']) !== $columnCount) {
                throw new \InvalidArgumentException('malformed solution.');
            }
            $grid->addSolution($this->buildSolution($position, [
                'expectedValue' => is_numeric($solution['expectedValue'] ?? null) ? (float) $solution['expectedValue'] : null,
                'rowAxis' => array_map(static fn ($value): ?float => is_numeric($value) ? (float) $value : null, array_values($solution['rowAxis'])),
                'columnAxis' => array_map(static fn ($value): ?float => is_numeric($value) ? (float) $value : null, array_values($solution['columnAxis'])),
            ]));
        }

        $previousStart = -1;
        foreach (is_array($entry['runs'] ?? null) ? $entry['runs'] : [] as $run) {
            [$start, $position] = is_array($run) && 2 === count($run) ? array_values($run) : [null, null];
            if (!is_int($start) || !is_int($position) || $start <= $previousStart || $start >= $axes->count() || !isset($solutions[$position])) {
                throw new \InvalidArgumentException('malformed run.');
            }
            if (-1 === $previousStart && 0 !== $start) {
                throw new \InvalidArgumentException('runs must start at combination 0.');
            }
            $grid->addRun($start, $position);
            $previousStart = $start;
        }
        if (-1 === $previousStart) {
            throw new \InvalidArgumentException('the grid has no runs.');
        }

        return $grid;
    }

    /**
     * @param list<ScenarioRow|ScenarioColumn> $items
     *
     * @return list<string>
     */
    private function axisLabels(array $items): array
    {
        usort($items, static fn (ScenarioRow|ScenarioColumn $a, ScenarioRow|ScenarioColumn $b): int => $a->getPosition() <=> $b->getPosition());

        return array_map(static fn (ScenarioRow|ScenarioColumn $item): string => trim($item->getLabel()), $items);
    }

    /**
     * @return list<array{expectedValue:float|null,rowAxis:list<float|null>,columnAxis:list<float|null>}>
     */
    private function solutionsPayload(ScenarioResourceGrid $grid): array
    {
        $scenario = $grid->getScenario();
        $rowCount = $scenario->getRows()->count();
        $columnCount = $scenario->getColumns()->count();

        $solutions = [];
        foreach ($grid->getSolutions() as $solution) {
            $rowAxis = array_fill(0, $rowCount, null);
            $columnAxis = array_fill(0, $columnCount, null);
            foreach ($solution->getProbabilities() as $probability) {
                if (ScenarioResourceGridProbability::SIDE_ROW === $probability->getSide()) {
                    $rowAxis[$probability->getAxisPosition()] = $probability->getProbability();
                } else {
                    $columnAxis[$probability->getAxisPosition()] = $probability->getProbability();
                }
            }
            $solutions[] = ['expectedValue' => $solution->getExpectedValue(), 'rowAxis' => $rowAxis, 'columnAxis' => $columnAxis];
        }

        return $solutions;
    }

    /**
     * @return list<array{int,int}>
     */
    private function runsPayload(ScenarioResourceGrid $grid): array
    {
        return array_map(
            static fn ($run): array => [$run->getStartIndex(), $run->getSolutionPosition()],
            $grid->getRuns()->toArray()
        );
    }

    /**
     * The character's first stock-like object, the one the scenario page's resource panel lets players change.
     */
    private function findObject(?Character $character): ?CharacterObject
    {
        if (null === $character) {
            return null;
        }

        return $this->entityManager->getRepository(CharacterObject::class)->findOneBy(
            ['characterName' => $character->getName()],
            ['sortOrder' => 'ASC', 'id' => 'ASC']
        );
    }

    private function objectMax(?CharacterObject $object): int
    {
        if (null === $object) {
            return 0;
        }

        return 'integer' === $object->getStatusType() ? max(0, (int) $object->getMaxStatus()) : 1;
    }

    /**
     * @param array{drive:float,super:float,object:int} $combination
     *
     * @return array{health:float,drive:float,super:float,objectStatuses:array<string,int|string>}
     */
    private function playerContext(array $combination, float $life, ?CharacterObject $object): array
    {
        $objectStatuses = [];
        $objectKey = $object?->getObjectKey();
        if (null !== $objectKey) {
            $objectStatuses[$objectKey] = 'integer' === $object->getStatusType()
                ? $combination['object']
                : (1 === $combination['object'] ? 'true' : 'false');
        }

        return ['health' => $life, 'drive' => $combination['drive'], 'super' => $combination['super'], 'objectStatuses' => $objectStatuses];
    }

    /**
     * @param array{expectedValue:float|null,rowAxis:list<float|null>,columnAxis:list<float|null>} $result
     *
     * @return array{expectedValue:float|null,rowAxis:list<float|null>,columnAxis:list<float|null>}
     */
    private function roundSolution(array $result): array
    {
        $round = static fn (?float $value): ?float => null === $value ? null : round($value, self::PROBABILITY_DECIMALS);

        return [
            'expectedValue' => null === $result['expectedValue'] ? null : round($result['expectedValue'], self::EXPECTED_VALUE_DECIMALS),
            'rowAxis' => array_map($round, $result['rowAxis']),
            'columnAxis' => array_map($round, $result['columnAxis']),
        ];
    }

    /**
     * @param array{expectedValue:float|null,rowAxis:list<float|null>,columnAxis:list<float|null>} $solution
     */
    private function buildSolution(int $position, array $solution): ScenarioResourceGridSolution
    {
        $entity = new ScenarioResourceGridSolution($position, $solution['expectedValue']);
        foreach ($solution['rowAxis'] as $axisPosition => $probability) {
            if (null !== $probability) {
                $entity->addProbability(ScenarioResourceGridProbability::SIDE_ROW, $axisPosition, $probability);
            }
        }
        foreach ($solution['columnAxis'] as $axisPosition => $probability) {
            if (null !== $probability) {
                $entity->addProbability(ScenarioResourceGridProbability::SIDE_COLUMN, $axisPosition, $probability);
            }
        }

        return $entity;
    }

    /**
     * @return array{key:string,name:string,max:int}|null
     */
    private function objectPayload(?string $objectKey, int $objectMax): ?array
    {
        if (null === $objectKey) {
            return null;
        }

        $object = $this->entityManager->getRepository(CharacterObject::class)->findOneBy(['objectKey' => $objectKey]);

        return ['key' => $objectKey, 'name' => $object?->getName() ?? $objectKey, 'max' => $objectMax];
    }
}
