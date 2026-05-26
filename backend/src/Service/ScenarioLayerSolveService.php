<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Scenario;
use App\Entity\ScenarioCell;
use App\Entity\ScenarioColumn;
use App\Entity\ScenarioRow;
use Psr\Cache\CacheItemPoolInterface;

class ScenarioLayerSolveService
{
    public function __construct(
        private readonly MixedStrategyGameSolver $mixedStrategyGameSolver,
        private readonly CacheItemPoolInterface $cachePool,
    ) {
    }

    /**
     * @return array{maxLayer:int,layers:array<int, array{rowAxis:list<float|null>,columnAxis:list<float|null>,expectedValue:float|null}>}
     */
    public function solveByLayer(Scenario $scenario, string $executionMode, ?int $difficultyCap): array
    {
        $rows = $scenario->getRows()->toArray();
        usort($rows, static fn (ScenarioRow $a, ScenarioRow $b): int => $a->getPosition() <=> $b->getPosition());

        $columns = $scenario->getColumns()->toArray();
        usort($columns, static fn (ScenarioColumn $a, ScenarioColumn $b): int => $a->getPosition() <=> $b->getPosition());

        $rowCount = count($rows);
        $columnCount = count($columns);
        $maxLayer = $this->computeMaxLayer($rows, $columns);

        if (0 === $rowCount || 0 === $columnCount || $maxLayer <= 0) {
            return ['maxLayer' => max(1, $maxLayer), 'layers' => []];
        }

        $cellsByCoordinate = $this->buildCellCoordinateMap($scenario);
        $layerSolutions = [];

        for ($layer = 1; $layer <= $maxLayer; $layer++) {
            $cacheKey = $this->buildCacheKey($scenario, $executionMode, $difficultyCap, $layer);
            $cacheItem = $this->cachePool->getItem($cacheKey);
            if ($cacheItem->isHit()) {
                $cached = $cacheItem->get();
                if (is_array($cached)) {
                    $layerSolutions[$layer] = $cached;
                    continue;
                }
            }

            $solution = $this->solveOneLayer($rows, $columns, $cellsByCoordinate, $layer);
            $cacheItem->set($solution);
            $cacheItem->expiresAfter(86400);
            $this->cachePool->save($cacheItem);
            $layerSolutions[$layer] = $solution;
        }

        return [
            'maxLayer' => $maxLayer,
            'layers' => $layerSolutions,
        ];
    }

    /**
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
     * @param list<ScenarioRow> $rows
     * @param list<ScenarioColumn> $columns
     * @param array<int, array<int, ScenarioCell>> $cellsByCoordinate
     *
     * @return array{rowAxis:list<float|null>,columnAxis:list<float|null>,expectedValue:float|null}
     */
    private function solveOneLayer(array $rows, array $columns, array $cellsByCoordinate, int $layer): array
    {
        $visibleRowIndexes = [];
        foreach ($rows as $index => $row) {
            if ($row->getLayer() <= $layer) {
                $visibleRowIndexes[] = $index;
            }
        }

        $visibleColumnIndexes = [];
        foreach ($columns as $index => $column) {
            if ($column->getLayer() <= $layer) {
                $visibleColumnIndexes[] = $index;
            }
        }

        $rowAxis = array_fill(0, count($rows), null);
        $columnAxis = array_fill(0, count($columns), null);

        if ([] === $visibleRowIndexes || [] === $visibleColumnIndexes) {
            return [
                'rowAxis' => $rowAxis,
                'columnAxis' => $columnAxis,
                'expectedValue' => null,
            ];
        }

        $rowKeys = [];
        foreach ($visibleRowIndexes as $rowIndex) {
            $rowKeys[$rowIndex] = $this->safeAxisKey((string) $rows[$rowIndex]->getLabel(), sprintf('row_%d', $rowIndex + 1));
        }

        $columnKeys = [];
        foreach ($visibleColumnIndexes as $columnIndex) {
            $columnKeys[$columnIndex] = $this->safeAxisKey((string) $columns[$columnIndex]->getLabel(), sprintf('column_%d', $columnIndex + 1));
        }

        $payoffMatrix = [];
        foreach ($visibleRowIndexes as $rowIndex) {
            $rowKey = $rowKeys[$rowIndex];
            $payoffMatrix[$rowKey] = [];
            foreach ($visibleColumnIndexes as $columnIndex) {
                $cell = $cellsByCoordinate[$rowIndex][$columnIndex] ?? null;
                $value = 0;
                if ($cell instanceof ScenarioCell) {
                    $raw = ScenarioCell::KIND_STATIC === $cell->getKind() ? $cell->getStaticValue() : $cell->getCachedValue();
                    $value = is_numeric($raw) ? (int) round((float) $raw) : 0;
                }
                $payoffMatrix[$rowKey][$columnKeys[$columnIndex]] = $value;
            }
        }

        $result = $this->mixedStrategyGameSolver->solveMixedStrategyGame($payoffMatrix);
        $equilibrium = $result['equilibria'][0] ?? null;
        if (!is_array($equilibrium)) {
            return [
                'rowAxis' => $rowAxis,
                'columnAxis' => $columnAxis,
                'expectedValue' => null,
            ];
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
            'rowAxis' => $rowAxis,
            'columnAxis' => $columnAxis,
            'expectedValue' => $expectedValue,
        ];
    }

    /**
     * @param list<ScenarioRow> $rows
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

    private function toProbability(mixed $value): float
    {
        if (!is_numeric($value)) {
            return 0.0;
        }

        return (float) $value;
    }

    private function safeAxisKey(string $label, string $fallback): string
    {
        $trimmed = trim($label);

        return '' !== $trimmed ? $trimmed : $fallback;
    }

    private function buildCacheKey(Scenario $scenario, string $executionMode, ?int $difficultyCap, int $layer): string
    {
        $updatedAt = $scenario->getUpdatedAt()->format('U');
        $scenarioId = $scenario->getPublicId()->toRfc4122();
        $cap = null === $difficultyCap ? 'none' : (string) $difficultyCap;

        return sprintf('scenario_layer_solve_%s_%s_%s_%s_%d', $scenarioId, $updatedAt, $executionMode, $cap, $layer);
    }
}
