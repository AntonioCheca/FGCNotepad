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
        private readonly ScenarioAxisResourceCostService $axisResourceCostService,
    ) {
    }

    /**
     * @return array{maxLayer:int,layers:array<int, array{rowAxis:list<float|null>,columnAxis:list<float|null>,expectedValue:float|null}>}
     */
    public function solveByLayer(Scenario $scenario, string $executionMode, ?int $difficultyCap, bool $useCache = true): array
    {
        return $this->solveLayers($scenario, [], false, fn (int $layer, \Closure $solve): array => $useCache
            ? $this->cachedLayer($this->buildCacheKey($scenario, $executionMode, $difficultyCap, $layer), $solve)
            : $solve());
    }

    /**
     * Solves every layer with the given reference cell values (keyed by spl_object_id of the cell) in place of their
     * stored cachedValue. Never cached: the values come from a linked-scenario iteration still in progress.
     *
     * @param array<int, float> $referenceValues
     *
     * @return array{maxLayer:int,layers:array<int, array{rowAxis:list<float|null>,columnAxis:list<float|null>,expectedValue:float|null}>}
     */
    public function solveByLayerWithReferenceValues(Scenario $scenario, array $referenceValues, bool $topLayerOnly = false): array
    {
        return $this->solveLayers($scenario, $referenceValues, $topLayerOnly, static fn (int $layer, \Closure $solve): array => $solve());
    }

    /**
     * @param array<int, float> $referenceValues
     * @param \Closure(int, \Closure(): array{rowAxis:list<float|null>,columnAxis:list<float|null>,expectedValue:float|null}): array{rowAxis:list<float|null>,columnAxis:list<float|null>,expectedValue:float|null} $solveLayer
     *
     * @return array{maxLayer:int,layers:array<int, array{rowAxis:list<float|null>,columnAxis:list<float|null>,expectedValue:float|null}>}
     */
    private function solveLayers(Scenario $scenario, array $referenceValues, bool $topLayerOnly, \Closure $solveLayer): array
    {
        $rows = $scenario->getRows()->toArray();
        usort($rows, static fn (ScenarioRow $a, ScenarioRow $b): int => $a->getPosition() <=> $b->getPosition());

        $columns = $scenario->getColumns()->toArray();
        usort($columns, static fn (ScenarioColumn $a, ScenarioColumn $b): int => $a->getPosition() <=> $b->getPosition());

        $maxLayer = $this->computeMaxLayer($rows, $columns);

        if ([] === $rows || [] === $columns) {
            return ['maxLayer' => $maxLayer, 'layers' => []];
        }

        $cellsByCoordinate = $this->buildCellCoordinateMap($scenario);
        $layerSolutions = [];

        for ($layer = $topLayerOnly ? $maxLayer : 1; $layer <= $maxLayer; $layer++) {
            $layerSolutions[$layer] = $solveLayer($layer, fn (): array => $this->solveOneLayer($rows, $columns, $cellsByCoordinate, $layer, $referenceValues));
        }

        return [
            'maxLayer' => $maxLayer,
            'layers' => $layerSolutions,
        ];
    }

    /**
     * @param \Closure(): array{rowAxis:list<float|null>,columnAxis:list<float|null>,expectedValue:float|null} $solve
     *
     * @return array{rowAxis:list<float|null>,columnAxis:list<float|null>,expectedValue:float|null}
     */
    private function cachedLayer(string $cacheKey, \Closure $solve): array
    {
        $cacheItem = $this->cachePool->getItem($cacheKey);
        if ($cacheItem->isHit()) {
            $cached = $cacheItem->get();
            if (is_array($cached)) {
                return $cached;
            }
        }

        $solution = $solve();
        $cacheItem->set($solution);
        $cacheItem->expiresAfter(86400);
        $this->cachePool->save($cacheItem);

        return $solution;
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
     * @param array<int, float> $referenceValues
     *
     * @return array{rowAxis:list<float|null>,columnAxis:list<float|null>,expectedValue:float|null}
     */
    private function solveOneLayer(array $rows, array $columns, array $cellsByCoordinate, int $layer, array $referenceValues): array
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
            $rowCost = $this->axisResourceCostService->payoffAdjustment($rows[$rowIndex]);
            $payoffMatrix[$rowKey] = [];
            foreach ($visibleColumnIndexes as $columnIndex) {
                $cell = $cellsByCoordinate[$rowIndex][$columnIndex] ?? null;
                $value = 0.0;
                if ($cell instanceof ScenarioCell) {
                    $raw = match (true) {
                        ScenarioCell::KIND_STATIC === $cell->getKind() => $cell->getStaticValue(),
                        isset($referenceValues[spl_object_id($cell)]) => $referenceValues[spl_object_id($cell)],
                        default => $cell->getCachedValue(),
                    };
                    $value = is_numeric($raw) ? (float) $raw : 0.0;
                }
                $value += $rowCost + $this->axisResourceCostService->payoffAdjustment($columns[$columnIndex]);
                $payoffMatrix[$rowKey][$columnKeys[$columnIndex]] = (int) round($value);
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

        return sprintf('scenario_layer_solve_v2_%s_%s_%s_%s_%d', $scenarioId, $updatedAt, $executionMode, $cap, $layer);
    }
}
