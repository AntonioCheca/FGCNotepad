<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Scenario;
use App\Entity\ScenarioCell;
use App\Entity\ScenarioColumn;
use App\Entity\ScenarioRow;
use App\Entity\User;

class ScenarioLinkedExpectedValueResolverService
{
    private const MAX_REFERENCE_DEPTH = 3;

    public function __construct(
        private readonly MixedStrategyGameSolver $mixedStrategyGameSolver,
        private readonly ResolveDynamicComboCellService $resolveDynamicComboCellService,
        private readonly ScenarioComboContextService $scenarioComboContextService,
    ) {
    }

    /**
     * @param array<string, array<string, float|int>|null> $resourceContext
     *
     * @return array{scenarioId:string,depth:int,expectedValue:float|null,rowAxis:list<float|null>,columnAxis:list<float|null>,resolvedCells:list<array<string, mixed>>}
     */
    public function resolve(
        Scenario $scenario,
        ?User $user = null,
        ?string $executionMode = null,
        ?int $difficultyCap = null,
        ?array $resourceContext = null,
        array $viewerContextPayload = [],
    ): array {
        return $this->resolveScenarioAtDepth($scenario, 1, $user, $executionMode, $difficultyCap, $resourceContext, $viewerContextPayload);
    }

    /**
     * @param array<string, array<string, float|int>|null> $resourceContext
     *
     * @return array{scenarioId:string,depth:int,expectedValue:float|null,rowAxis:list<float|null>,columnAxis:list<float|null>,resolvedCells:list<array<string, mixed>>}
     */
    private function resolveScenarioAtDepth(
        Scenario $scenario,
        int $depth,
        ?User $user,
        ?string $executionMode,
        ?int $difficultyCap,
        ?array $resourceContext,
        array $viewerContextPayload,
    ): array {
        $rows = $scenario->getRows()->toArray();
        usort($rows, static fn (ScenarioRow $a, ScenarioRow $b): int => $a->getPosition() <=> $b->getPosition());

        $columns = $scenario->getColumns()->toArray();
        usort($columns, static fn (ScenarioColumn $a, ScenarioColumn $b): int => $a->getPosition() <=> $b->getPosition());

        $maxLayer = $this->computeMaxLayer($rows, $columns);
        $visibleRowIndexes = $this->visibleIndexes($rows, $maxLayer);
        $visibleColumnIndexes = $this->visibleIndexes($columns, $maxLayer);
        $rowAxis = array_fill(0, count($rows), null);
        $columnAxis = array_fill(0, count($columns), null);

        if ([] === $visibleRowIndexes || [] === $visibleColumnIndexes) {
            return $this->emptyResult($scenario, $depth, $rowAxis, $columnAxis);
        }

        $cellsByCoordinate = $this->buildCellCoordinateMap($scenario);
        $rowKeys = $this->buildAxisKeys($rows, $visibleRowIndexes, 'row');
        $columnKeys = $this->buildAxisKeys($columns, $visibleColumnIndexes, 'column');
        $resolvedCells = [];
        $payoffMatrix = [];

        foreach ($visibleRowIndexes as $rowIndex) {
            $rowKey = $rowKeys[$rowIndex];
            $payoffMatrix[$rowKey] = [];

            foreach ($visibleColumnIndexes as $columnIndex) {
                $cell = $cellsByCoordinate[$rowIndex][$columnIndex] ?? null;
                $resolved = $this->resolveCellValue($cell, $depth, $user, $executionMode, $difficultyCap, $resourceContext, $viewerContextPayload);
                $payoffMatrix[$rowKey][$columnKeys[$columnIndex]] = (int) round($resolved['finalValue']);

                if ($cell instanceof ScenarioCell && ScenarioCell::KIND_REFERENCE === $cell->getKind()) {
                    $resolvedCells[] = [
                        'row' => $rowIndex,
                        'column' => $columnIndex,
                        'scenarioId' => $cell->getReferenceScenario()?->getPublicId()->toRfc4122(),
                        'basePreValue' => $resolved['basePreValue'],
                        'linkedExpectedValue' => $resolved['linkedExpectedValue'],
                        'finalValue' => $resolved['finalValue'],
                        'depth' => $depth,
                    ];
                }
            }
        }

        $result = $this->mixedStrategyGameSolver->solveMixedStrategyGame($payoffMatrix);
        $equilibrium = $result['equilibria'][0] ?? null;
        if (!is_array($equilibrium)) {
            return $this->emptyResult($scenario, $depth, $rowAxis, $columnAxis, $resolvedCells);
        }

        $expectedValue = 0.0;
        foreach ($visibleRowIndexes as $rowIndex) {
            $rowKey = $rowKeys[$rowIndex];
            $rowProbability = $this->toProbability($equilibrium['P1'][$rowKey] ?? null);
            $rowAxis[$rowIndex] = $rowProbability;

            foreach ($visibleColumnIndexes as $columnIndex) {
                $columnKey = $columnKeys[$columnIndex];
                $columnProbability = $this->toProbability($equilibrium['P2'][$columnKey] ?? null);
                $expectedValue += ($payoffMatrix[$rowKey][$columnKey] ?? 0) * $rowProbability * $columnProbability;
            }
        }

        foreach ($visibleColumnIndexes as $columnIndex) {
            $columnAxis[$columnIndex] = $this->toProbability($equilibrium['P2'][$columnKeys[$columnIndex]] ?? null);
        }

        return [
            'scenarioId' => $scenario->getPublicId()->toRfc4122(),
            'depth' => $depth,
            'expectedValue' => $expectedValue,
            'rowAxis' => $rowAxis,
            'columnAxis' => $columnAxis,
            'resolvedCells' => $resolvedCells,
        ];
    }

    /**
     * @param array<string, array<string, float|int>|null> $resourceContext
     *
     * @return array{basePreValue:float,linkedExpectedValue:float,finalValue:float}
     */
    private function resolveCellValue(
        ?ScenarioCell $cell,
        int $depth,
        ?User $user,
        ?string $executionMode,
        ?int $difficultyCap,
        ?array $resourceContext,
        array $viewerContextPayload,
    ): array {
        if (!$cell instanceof ScenarioCell) {
            return ['basePreValue' => 0.0, 'linkedExpectedValue' => 0.0, 'finalValue' => 0.0];
        }

        if (ScenarioCell::KIND_REFERENCE === $cell->getKind()) {
            $basePreValue = $this->resolveReferencePreValue($cell, $user, $executionMode, $difficultyCap, $resourceContext, $viewerContextPayload);
            $linkedExpectedValue = 0.0;
            $referenceScenario = $cell->getReferenceScenario();

            if ($referenceScenario instanceof Scenario && $depth < self::MAX_REFERENCE_DEPTH) {
                $linked = $this->resolveScenarioAtDepth($referenceScenario, $depth + 1, $user, $executionMode, $difficultyCap, $resourceContext, $viewerContextPayload);
                $linkedExpectedValue = null !== $linked['expectedValue'] ? $linked['expectedValue'] : 0.0;
            }

            return [
                'basePreValue' => $basePreValue,
                'linkedExpectedValue' => $linkedExpectedValue,
                'finalValue' => $basePreValue + $linkedExpectedValue,
            ];
        }

        if (ScenarioCell::KIND_DYNAMIC_COMBO === $cell->getKind()) {
            $value = $this->resolveDynamicComboValue($cell, $user, $executionMode, $difficultyCap, $resourceContext, $viewerContextPayload);

            return ['basePreValue' => $value, 'linkedExpectedValue' => 0.0, 'finalValue' => $value];
        }

        $value = null !== $cell->getStaticValue() ? (float) $cell->getStaticValue() : 0.0;

        return ['basePreValue' => $value, 'linkedExpectedValue' => 0.0, 'finalValue' => $value];
    }

    /**
     * @param array<string, array<string, float|int>|null> $resourceContext
     */
    private function resolveReferencePreValue(
        ScenarioCell $cell,
        ?User $user,
        ?string $executionMode,
        ?int $difficultyCap,
        ?array $resourceContext,
        array $viewerContextPayload,
    ): float {
        if ($cell->getStarterMoves()->count() > 0) {
            return $this->resolveDynamicComboValue($cell, $user, $executionMode, $difficultyCap, $resourceContext, $viewerContextPayload);
        }

        return null !== $cell->getStaticValue() ? (float) $cell->getStaticValue() : 0.0;
    }

    /**
     * @param array<string, array<string, float|int>|null> $resourceContext
     */
    private function resolveDynamicComboValue(
        ScenarioCell $cell,
        ?User $user,
        ?string $executionMode,
        ?int $difficultyCap,
        ?array $resourceContext,
        array $viewerContextPayload,
    ): float {
        $scenario = $cell->getScenario();
        $attackerCharacterId = $scenario?->getAttackerCharacter()?->getId()?->toRfc4122();
        $defenderCharacterId = $scenario?->getDefenderCharacter()?->getId()?->toRfc4122();
        if (null === $attackerCharacterId || null === $defenderCharacterId) {
            return 0.0;
        }

        $starterMoveIds = [];
        foreach ($cell->getStarterMoves() as $starterMove) {
            $starterMoveId = $starterMove->getId()?->toRfc4122();
            if (null !== $starterMoveId && '' !== $starterMoveId) {
                $starterMoveIds[] = $starterMoveId;
            }
        }

        if ([] === $starterMoveIds) {
            return 0.0;
        }

        $isAttackerInitiated = $cell->isComboInitiatorAttacker();
        $resolution = $this->resolveDynamicComboCellService->resolve(
            $isAttackerInitiated ? $attackerCharacterId : $defenderCharacterId,
            $starterMoveIds,
            $this->toHitType($cell->getStarterContext()),
            $user,
            $executionMode,
            $difficultyCap,
            null !== $resourceContext ? $resourceContext[$isAttackerInitiated ? 'attacker' : 'defender'] : null,
            $this->scenarioComboContextService->buildEffectiveContext($scenario, $viewerContextPayload),
        );

        return is_numeric($resolution['resolvedDamage']) ? (float) $resolution['resolvedDamage'] : 0.0;
    }

    /**
     * @param list<ScenarioCell> $cells
     *
     * @return array<int, array<int, ScenarioCell>>
     */
    private function buildCellCoordinateMap(Scenario $scenario): array
    {
        $cellsByCoordinate = [];
        foreach ($scenario->getCells() as $cell) {
            $rowPosition = $cell->getRow()?->getPosition();
            $columnPosition = $cell->getColumn()?->getPosition();
            if (null === $rowPosition || null === $columnPosition) {
                continue;
            }
            $cellsByCoordinate[$rowPosition][$columnPosition] = $cell;
        }

        return $cellsByCoordinate;
    }

    /**
     * @param list<ScenarioRow|ScenarioColumn> $items
     *
     * @return list<int>
     */
    private function visibleIndexes(array $items, int $layer): array
    {
        $indexes = [];
        foreach ($items as $index => $item) {
            if ($item->getLayer() <= $layer) {
                $indexes[] = $index;
            }
        }

        return $indexes;
    }

    /**
     * @param list<ScenarioRow|ScenarioColumn> $items
     * @param list<int>                       $indexes
     *
     * @return array<int, string>
     */
    private function buildAxisKeys(array $items, array $indexes, string $prefix): array
    {
        $keys = [];
        foreach ($indexes as $index) {
            $label = trim((string) $items[$index]->getLabel());
            $keys[$index] = '' !== $label ? $label : sprintf('%s_%d', $prefix, $index + 1);
        }

        return $keys;
    }

    /**
     * @param list<ScenarioRow>    $rows
     * @param list<ScenarioColumn> $columns
     */
    private function computeMaxLayer(array $rows, array $columns): int
    {
        $max = 1;
        foreach ($rows as $row) {
            $max = max($max, $row->getLayer());
        }
        foreach ($columns as $column) {
            $max = max($max, $column->getLayer());
        }

        return $max;
    }

    private function toHitType(?string $starterContext): string
    {
        if ('punish_counter' === $starterContext) {
            return 'punish_counter';
        }

        if ('counter_hit' === $starterContext) {
            return 'counter_hit';
        }

        return 'normal';
    }

    private function toProbability(mixed $value): float
    {
        return is_numeric($value) ? (float) $value : 0.0;
    }

    /**
     * @param list<float|null> $rowAxis
     * @param list<float|null> $columnAxis
     * @param list<array<string, mixed>> $resolvedCells
     *
     * @return array{scenarioId:string,depth:int,expectedValue:float|null,rowAxis:list<float|null>,columnAxis:list<float|null>,resolvedCells:list<array<string, mixed>>}
     */
    private function emptyResult(Scenario $scenario, int $depth, array $rowAxis, array $columnAxis, array $resolvedCells = []): array
    {
        return [
            'scenarioId' => $scenario->getPublicId()->toRfc4122(),
            'depth' => $depth,
            'expectedValue' => null,
            'rowAxis' => $rowAxis,
            'columnAxis' => $columnAxis,
            'resolvedCells' => $resolvedCells,
        ];
    }
}
