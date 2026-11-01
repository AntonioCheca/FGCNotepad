<?php declare(strict_types=1);

namespace App\Service\ScenarioTransfer;

use App\Entity\CharacterObjectState;
use App\Entity\Move;
use App\Entity\Scenario;
use App\Entity\ScenarioCell;
use App\Entity\ScenarioColumn;
use App\Entity\ScenarioColumnResourceRequirement;
use App\Entity\ScenarioComboContext;
use App\Entity\ScenarioRow;
use App\Entity\ScenarioRowResourceRequirement;

/**
 * Builds scenario_export_v1 documents from the stored scenario state, including edits made in the scenario UI.
 * Dynamic combo cells export their starter, never the resolved value. The output holds no database ids or
 * timestamps apart from the document's exportedAt, so exporting the same state twice gives the same scenarios.
 */
final class ScenarioExportService
{
    /**
     * @param list<Scenario> $scenarios
     *
     * @return array<string, mixed>
     */
    public function exportDocument(array $scenarios): array
    {
        return [
            'format' => ScenarioExportFormat::FORMAT,
            'exportedAt' => (new \DateTimeImmutable())->format(DATE_ATOM),
            'scenarios' => array_map(fn (Scenario $scenario): array => $this->exportScenario($scenario), $scenarios),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function exportScenario(Scenario $scenario): array
    {
        $rows = $this->sortedAxis($scenario->getRows()->toArray());
        $columns = $this->sortedAxis($scenario->getColumns()->toArray());
        $rowKeys = ScenarioExportFormat::axisKeys(array_map(static fn (ScenarioRow $row): string => $row->getLabel(), $rows), 'row');
        $columnKeys = ScenarioExportFormat::axisKeys(array_map(static fn (ScenarioColumn $column): string => $column->getLabel(), $columns), 'column');

        $cellsByCoordinate = [];
        foreach ($scenario->getCells() as $cell) {
            $cellsByCoordinate[spl_object_id($cell->getRow())][spl_object_id($cell->getColumn())] = $cell;
        }

        $cells = [];
        foreach ($rows as $rowIndex => $row) {
            foreach ($columns as $columnIndex => $column) {
                $cells[] = $this->exportCell(
                    $scenario,
                    $rowKeys[$rowIndex],
                    $columnKeys[$columnIndex],
                    $cellsByCoordinate[spl_object_id($row)][spl_object_id($column)] ?? null
                );
            }
        }

        return [
            'key' => $this->scenarioKey($scenario),
            'name' => (string) $scenario->getName(),
            'scenarioType' => $scenario->getScenarioType(),
            'isEssential' => $scenario->isEssential(),
            'attacker' => (string) $scenario->getAttackerCharacter()?->getName(),
            'defender' => (string) $scenario->getDefenderCharacter()?->getName(),
            'situation' => $this->exportSituation($scenario),
            'rows' => array_map(fn (ScenarioRow $row, string $key): array => $this->exportAxisItem($row, $key), $rows, $rowKeys),
            'columns' => array_map(fn (ScenarioColumn $column, string $key): array => $this->exportAxisItem($column, $key), $columns, $columnKeys),
            'cells' => $cells,
        ];
    }

    /**
     * @return array{source:string,externalId:string}
     */
    public function scenarioKey(Scenario $scenario): array
    {
        $source = $scenario->getImportSource();
        $externalId = $scenario->getImportExternalId();
        if (null !== $source && null !== $externalId) {
            return ['source' => $source, 'externalId' => $externalId];
        }

        return ['source' => ScenarioExportFormat::SITE_SOURCE, 'externalId' => $scenario->getPublicId()->toRfc4122()];
    }

    /**
     * @return array<string, mixed>
     */
    private function exportSituation(Scenario $scenario): array
    {
        $context = $scenario->getComboContext();
        $triggerMove = $scenario->getTriggerMove();
        $statuses = array_map(
            static fn (CharacterObjectState $status): array => [
                'object' => (string) ($status->getObjectKey() ?? $status->getObjectName()),
                'status' => (string) $status->getStatusRequired(),
            ],
            array_values($context?->getCharacterStatuses()->toArray() ?? [])
        );
        usort($statuses, static fn (array $a, array $b): int => $a['object'] <=> $b['object']);

        return [
            'triggerMove' => [
                'character' => (string) $triggerMove?->getCharacter()->getName(),
                'notation' => (string) $triggerMove?->getNumpadNotation(),
            ],
            'position' => $context?->getPositionLock() ?? ScenarioComboContext::POSITION_VIEWER_DEFAULT_MIDSCREEN,
            'knockdownAdvantage' => $scenario->getKnockdownAdvantage(),
            'characterStatuses' => $statuses,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function exportAxisItem(ScenarioRow|ScenarioColumn $item, string $key): array
    {
        $requirements = $item->getResourceRequirements()->toArray();
        usort($requirements, static fn (ScenarioRowResourceRequirement|ScenarioColumnResourceRequirement $a, ScenarioRowResourceRequirement|ScenarioColumnResourceRequirement $b): int => $a->getPosition() <=> $b->getPosition());

        return [
            'key' => $key,
            'label' => $item->getLabel(),
            'description' => $item->getDescription(),
            'layer' => $item->getLayer(),
            'requirements' => array_map(
                static fn (ScenarioRowResourceRequirement|ScenarioColumnResourceRequirement $requirement): array => [
                    'owner' => $requirement->getResourceOwner(),
                    'resource' => $requirement->getResourceType(),
                    'threshold' => $requirement->getThresholdValue(),
                ],
                $requirements
            ),
            'summaryValue' => $item->getSummaryValue(),
        ] + (null === $item->getSeenFrequency() ? [] : [
            'stats' => ['seenFrequency' => $item->getSeenFrequency(), 'sampleCount' => $item->getSeenSampleCount()],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function exportCell(Scenario $scenario, string $rowKey, string $columnKey, ?ScenarioCell $cell): array
    {
        $payload = ['row' => $rowKey, 'column' => $columnKey];

        if (null === $cell || ScenarioCell::KIND_STATIC === $cell->getKind()) {
            $payload += ['kind' => ScenarioCell::KIND_STATIC, 'value' => $cell?->getStaticValue()];
        } elseif (ScenarioCell::KIND_DYNAMIC_COMBO === $cell->getKind()) {
            $payload += ['kind' => ScenarioCell::KIND_DYNAMIC_COMBO, 'starter' => $this->exportStarter($cell)];
        } else {
            $payload += ['kind' => ScenarioCell::KIND_REFERENCE, 'reference' => $this->exportReference($cell)];
        }

        if (null !== $cell && $cell->hasProvenance()) {
            $payload['provenance'] = [
                'status' => $cell->getProvenanceStatus(),
                'sampleCount' => $cell->getProvenanceSampleCount(),
                'confidence' => $cell->getProvenanceConfidence(),
                'note' => $cell->getProvenanceNote(),
            ];
        }

        return $payload;
    }

    /**
     * @return array<string, mixed>
     */
    private function exportReference(ScenarioCell $cell): array
    {
        $referenced = $cell->getReferenceScenario();
        $preValue = null;
        if ($cell->getStarterMoves()->count() > 0) {
            $preValue = ['kind' => ScenarioCell::KIND_DYNAMIC_COMBO, 'starter' => $this->exportStarter($cell)];
        } elseif (null !== $cell->getStaticValue()) {
            $preValue = ['kind' => ScenarioCell::KIND_STATIC, 'value' => $cell->getStaticValue()];
        }

        return ScenarioExportFormat::referencePayload(
            null !== $referenced ? $this->scenarioKey($referenced) : null,
            $cell->getReferenceKind() ?? 'reference',
            $cell->getReferenceWeight(),
            $cell->getReferencePerspective(),
            $cell->getCachedValue(),
            $preValue,
        );
    }

    /**
     * @return array{initiator:string,moves:list<string>,hitCondition:string}
     */
    private function exportStarter(ScenarioCell $cell): array
    {
        $moves = array_map(static fn (Move $move): string => $move->getNumpadNotation(), $cell->getStarterMoves()->toArray());
        sort($moves);

        return [
            'initiator' => $cell->isComboInitiatorAttacker() ? 'attacker' : 'defender',
            'moves' => $moves,
            'hitCondition' => $cell->getStarterContext() ?? 'normal',
        ];
    }

    /**
     * @template T of ScenarioRow|ScenarioColumn
     *
     * @param array<int, T> $items
     *
     * @return list<T>
     */
    private function sortedAxis(array $items): array
    {
        usort($items, static fn (ScenarioRow|ScenarioColumn $a, ScenarioRow|ScenarioColumn $b): int => $a->getPosition() <=> $b->getPosition());

        return $items;
    }
}
