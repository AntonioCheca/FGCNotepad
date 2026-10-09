<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Scenario;
use App\Entity\ScenarioColumn;
use App\Entity\ScenarioLayerSolution;
use App\Entity\ScenarioRow;

class ScenarioSavedSolutionService
{
    public function __construct(
        private readonly ScenarioLayerSolveService $scenarioLayerSolveService,
    ) {
    }

    public function refresh(Scenario $scenario): void
    {
        $solved = $this->scenarioLayerSolveService->solveByLayer($scenario, ScenarioExecutionModeService::MODE_STANDARD, null, false);
        $rows = $this->sortedRows($scenario);
        $columns = $this->sortedColumns($scenario);
        $existingByLayer = [];
        foreach ($scenario->getLayerSolutions() as $solution) {
            $existingByLayer[$solution->getLayer()] = $solution;
        }

        $solvedAt = new \DateTimeImmutable();
        foreach ($solved['layers'] as $layer => $layerSolution) {
            $solution = $existingByLayer[$layer] ?? null;
            unset($existingByLayer[$layer]);
            if (null === $solution) {
                $solution = new ScenarioLayerSolution($layer, $layerSolution['expectedValue'], $solvedAt);
                $scenario->addLayerSolution($solution);
            } else {
                $solution->replaceResult($layerSolution['expectedValue'], $solvedAt);
            }

            foreach ($layerSolution['rowAxis'] as $index => $probability) {
                if (null !== $probability && isset($rows[$index])) {
                    $solution->addRowProbability($rows[$index], $probability);
                }
            }
            foreach ($layerSolution['columnAxis'] as $index => $probability) {
                if (null !== $probability && isset($columns[$index])) {
                    $solution->addColumnProbability($columns[$index], $probability);
                }
            }
        }

        foreach ($existingByLayer as $staleSolution) {
            $scenario->removeLayerSolution($staleSolution);
        }
    }

    /**
     * Must run before a matrix edit deletes rows and columns: the mapper flushes mid-update, and stored
     * probabilities still pointing at deleted axes would break that flush. refresh() fills them again.
     */
    public function releaseAxisReferences(Scenario $scenario): void
    {
        foreach ($scenario->getLayerSolutions() as $solution) {
            $solution->getRowProbabilities()->clear();
            $solution->getColumnProbabilities()->clear();
        }
    }

    /**
     * Same layer-keyed shape as the live solve-layers endpoint, so the frontend renders both the same way.
     *
     * @return array{maxLayer:int,layers:array<int, array{rowAxis:list<float|null>,columnAxis:list<float|null>,expectedValue:float|null}>}|null
     */
    public function buildSnapshot(Scenario $scenario): ?array
    {
        if ($scenario->getLayerSolutions()->isEmpty()) {
            return null;
        }

        $rowIndexById = array_flip(array_map(static fn (ScenarioRow $row): ?int => $row->getId(), $this->sortedRows($scenario)));
        $columnIndexById = array_flip(array_map(static fn (ScenarioColumn $column): ?int => $column->getId(), $this->sortedColumns($scenario)));

        $layers = [];
        $maxLayer = 1;
        foreach ($scenario->getLayerSolutions() as $solution) {
            $rowAxis = array_fill(0, count($rowIndexById), null);
            foreach ($solution->getRowProbabilities() as $rowProbability) {
                $index = $rowIndexById[$rowProbability->getRow()->getId()] ?? null;
                if (null !== $index) {
                    $rowAxis[$index] = $rowProbability->getProbability();
                }
            }

            $columnAxis = array_fill(0, count($columnIndexById), null);
            foreach ($solution->getColumnProbabilities() as $columnProbability) {
                $index = $columnIndexById[$columnProbability->getColumn()->getId()] ?? null;
                if (null !== $index) {
                    $columnAxis[$index] = $columnProbability->getProbability();
                }
            }

            $layers[$solution->getLayer()] = [
                'rowAxis' => $rowAxis,
                'columnAxis' => $columnAxis,
                'expectedValue' => $solution->getExpectedValue(),
            ];
            $maxLayer = max($maxLayer, $solution->getLayer());
        }

        return ['maxLayer' => $maxLayer, 'layers' => $layers];
    }

    /**
     * @return list<ScenarioRow>
     */
    private function sortedRows(Scenario $scenario): array
    {
        $rows = $scenario->getRows()->toArray();
        usort($rows, static fn (ScenarioRow $a, ScenarioRow $b): int => $a->getPosition() <=> $b->getPosition());

        return $rows;
    }

    /**
     * @return list<ScenarioColumn>
     */
    private function sortedColumns(Scenario $scenario): array
    {
        $columns = $scenario->getColumns()->toArray();
        usort($columns, static fn (ScenarioColumn $a, ScenarioColumn $b): int => $a->getPosition() <=> $b->getPosition());

        return $columns;
    }
}
