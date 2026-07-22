<?php declare(strict_types=1);

namespace App\Service;

class MixedStrategyGameSolver
{
    private const ITERATIONS = 2000;
    private const ETA = 0.05;
    private const PERTURBATION_EPSILON = 1.0E-6;

    /**
     * @param array<string, array<string, int|float>> $payoffMatrix
     * @return array<string, mixed>
     */
    public function solveMixedStrategyGame(array $payoffMatrix): array
    {
        $result = ['equilibria' => $this->solveEquilibria($payoffMatrix)];

        $result['derivedMetrics'] = $this->calculateAllMetrics($result, $payoffMatrix);

        return $result;
    }

    /**
     * @param array<string, array<string, int|float>> $payoffMatrix
     * @return list<array{P1:array<string, float>,P2:array<string, float>}>
     */
    private function solveEquilibria(array $payoffMatrix): array
    {
        if ([] === $payoffMatrix) {
            throw new \InvalidArgumentException('Payoff matrix must contain at least one row.');
        }

        $rowLabels = array_keys($payoffMatrix);
        $firstRow = reset($payoffMatrix);
        if (!is_array($firstRow) || [] === $firstRow) {
            throw new \InvalidArgumentException('Payoff matrix must contain at least one column.');
        }

        $columnLabels = array_keys($firstRow);
        $matrix = [];
        foreach ($rowLabels as $rowLabel) {
            $row = $payoffMatrix[$rowLabel];
            if (!is_array($row)) {
                throw new \InvalidArgumentException('Payoff matrix rows must be arrays.');
            }

            $matrixRow = [];
            foreach ($columnLabels as $columnLabel) {
                if (!array_key_exists($columnLabel, $row) || !is_numeric($row[$columnLabel])) {
                    throw new \InvalidArgumentException('Payoff matrix must be rectangular and numeric.');
                }

                $matrixRow[] = (float) $row[$columnLabel];
            }
            $matrix[] = $matrixRow;
        }

        $matrix = $this->rescale($matrix);
        [$matrix, $rowLabels, $columnLabels] = $this->prune($matrix, $rowLabels, $columnLabels);
        $matrix = $this->perturb($matrix);

        [$p1Distribution, $p2Distribution] = $this->solveWithMultiplicativeWeights($matrix);

        return [[
            'P1' => $this->formatDistribution($rowLabels, $p1Distribution),
            'P2' => $this->formatDistribution($columnLabels, $p2Distribution),
        ]];
    }

    /**
     * @param list<list<float>> $matrix
     * @return list<list<float>>
     */
    private function rescale(array $matrix): array
    {
        $min = null;
        $max = null;
        foreach ($matrix as $row) {
            foreach ($row as $value) {
                $min = null === $min ? $value : min($min, $value);
                $max = null === $max ? $value : max($max, $value);
            }
        }

        if (null === $min || null === $max || $max <= $min) {
            return $matrix;
        }

        $range = $max - $min;
        foreach ($matrix as $rowIndex => $row) {
            foreach ($row as $columnIndex => $value) {
                $matrix[$rowIndex][$columnIndex] = ($value - $min) / $range;
            }
        }

        return $matrix;
    }

    /**
     * @param list<list<float>> $matrix
     * @param list<string>      $rowLabels
     * @param list<string>      $columnLabels
     * @return array{list<list<float>>,list<string>,list<string>}
     */
    private function prune(array $matrix, array $rowLabels, array $columnLabels): array
    {
        $keepRows = [];
        foreach ($matrix as $rowIndex => $row) {
            $dominated = false;
            foreach ($matrix as $otherIndex => $otherRow) {
                if ($rowIndex === $otherIndex) {
                    continue;
                }
                if ($this->allGreaterOrEqual($otherRow, $row) && $this->anyGreater($otherRow, $row)) {
                    $dominated = true;
                    break;
                }
            }
            if (!$dominated) {
                $keepRows[] = $rowIndex;
            }
        }

        $matrix = array_values(array_map(static fn (int $rowIndex): array => $matrix[$rowIndex], $keepRows));
        $rowLabels = array_values(array_map(static fn (int $rowIndex): string => $rowLabels[$rowIndex], $keepRows));

        $keepColumns = [];
        foreach ($columnLabels as $columnIndex => $_columnLabel) {
            $column = $this->column($matrix, $columnIndex);
            $dominated = false;
            foreach ($columnLabels as $otherIndex => $_otherLabel) {
                if ($columnIndex === $otherIndex) {
                    continue;
                }
                $otherColumn = $this->column($matrix, $otherIndex);
                if ($this->allLessOrEqual($otherColumn, $column) && $this->anyLess($otherColumn, $column)) {
                    $dominated = true;
                    break;
                }
            }
            if (!$dominated) {
                $keepColumns[] = $columnIndex;
            }
        }

        $matrix = array_map(static function (array $row) use ($keepColumns): array {
            return array_values(array_map(static fn (int $columnIndex): float => $row[$columnIndex], $keepColumns));
        }, $matrix);
        $columnLabels = array_values(array_map(static fn (int $columnIndex): string => $columnLabels[$columnIndex], $keepColumns));

        return [$matrix, $rowLabels, $columnLabels];
    }

    /**
     * @param list<list<float>> $matrix
     * @return list<list<float>>
     */
    private function perturb(array $matrix): array
    {
        mt_srand(42);
        foreach ($matrix as $rowIndex => $row) {
            foreach ($row as $columnIndex => $_value) {
                $matrix[$rowIndex][$columnIndex] += $this->normalRandom() * self::PERTURBATION_EPSILON;
            }
        }

        return $matrix;
    }

    /**
     * @param list<list<float>> $matrix
     * @return array{list<float>,list<float>}
     */
    private function solveWithMultiplicativeWeights(array $matrix): array
    {
        $rowCount = count($matrix);
        $columnCount = count($matrix[0] ?? []);
        if (0 === $rowCount || 0 === $columnCount) {
            throw new \InvalidArgumentException('Payoff matrix cannot be empty after pruning.');
        }

        $p1Distribution = array_fill(0, $rowCount, 1.0 / $rowCount);
        $p2Distribution = array_fill(0, $columnCount, 1.0 / $columnCount);
        $averageP1 = array_fill(0, $rowCount, 0.0);
        $averageP2 = array_fill(0, $columnCount, 0.0);

        for ($iteration = 1; $iteration <= self::ITERATIONS; $iteration++) {
            $p1Payoffs = [];
            for ($rowIndex = 0; $rowIndex < $rowCount; $rowIndex++) {
                $payoff = 0.0;
                for ($columnIndex = 0; $columnIndex < $columnCount; $columnIndex++) {
                    $payoff += $matrix[$rowIndex][$columnIndex] * $p2Distribution[$columnIndex];
                }
                $p1Payoffs[$rowIndex] = $payoff;
            }

            $p2Payoffs = [];
            for ($columnIndex = 0; $columnIndex < $columnCount; $columnIndex++) {
                $payoff = 0.0;
                for ($rowIndex = 0; $rowIndex < $rowCount; $rowIndex++) {
                    $payoff -= $matrix[$rowIndex][$columnIndex] * $p1Distribution[$rowIndex];
                }
                $p2Payoffs[$columnIndex] = $payoff;
            }

            for ($rowIndex = 0; $rowIndex < $rowCount; $rowIndex++) {
                $p1Distribution[$rowIndex] *= exp(self::ETA * $p1Payoffs[$rowIndex]);
            }
            for ($columnIndex = 0; $columnIndex < $columnCount; $columnIndex++) {
                $p2Distribution[$columnIndex] *= exp(self::ETA * $p2Payoffs[$columnIndex]);
            }

            $p1Distribution = $this->normalize($p1Distribution);
            $p2Distribution = $this->normalize($p2Distribution);

            for ($rowIndex = 0; $rowIndex < $rowCount; $rowIndex++) {
                $averageP1[$rowIndex] += $p1Distribution[$rowIndex];
            }
            for ($columnIndex = 0; $columnIndex < $columnCount; $columnIndex++) {
                $averageP2[$columnIndex] += $p2Distribution[$columnIndex];
            }
        }

        return [
            array_map(static fn (float $probability): float => $probability / self::ITERATIONS, $averageP1),
            array_map(static fn (float $probability): float => $probability / self::ITERATIONS, $averageP2),
        ];
    }

    /**
     * @param list<float> $values
     * @return list<float>
     */
    private function normalize(array $values): array
    {
        $sum = array_sum($values);
        if (0.0 === $sum) {
            return $values;
        }

        foreach ($values as $index => $value) {
            $values[$index] = $value / $sum;
        }

        return $values;
    }

    private function normalRandom(): float
    {
        $u1 = max(mt_rand() / mt_getrandmax(), PHP_FLOAT_EPSILON);
        $u2 = mt_rand() / mt_getrandmax();

        return sqrt(-2.0 * log($u1)) * cos(2.0 * M_PI * $u2);
    }

    /**
     * @param list<string> $labels
     * @param list<float>  $distribution
     * @return array<string, float>
     */
    private function formatDistribution(array $labels, array $distribution): array
    {
        $formatted = [];
        foreach ($labels as $index => $label) {
            $formatted[$label] = $distribution[$index];
        }

        return $formatted;
    }

    /**
     * @param list<float> $left
     * @param list<float> $right
     */
    private function allGreaterOrEqual(array $left, array $right): bool
    {
        foreach ($left as $index => $value) {
            if ($value < $right[$index]) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param list<float> $left
     * @param list<float> $right
     */
    private function anyGreater(array $left, array $right): bool
    {
        foreach ($left as $index => $value) {
            if ($value > $right[$index]) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param list<float> $left
     * @param list<float> $right
     */
    private function allLessOrEqual(array $left, array $right): bool
    {
        foreach ($left as $index => $value) {
            if ($value > $right[$index]) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param list<float> $left
     * @param list<float> $right
     */
    private function anyLess(array $left, array $right): bool
    {
        foreach ($left as $index => $value) {
            if ($value < $right[$index]) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param list<list<float>> $matrix
     * @return list<float>
     */
    private function column(array $matrix, int $columnIndex): array
    {
        return array_map(static fn (array $row): float => $row[$columnIndex], $matrix);
    }

    /**
     * @param array<string, mixed> $solverResult
     * @param array<string, array<string, int>> $payoffMatrix
     * @return array<string, array<string, mixed>>
     */
    private function calculateAllMetrics(array $solverResult, array $payoffMatrix): array
    {
        $metrics = ['P1' => [], 'P2' => []];

        $equilibria = $solverResult['equilibria'] ?? [];
        if (empty($equilibria)) {
            return $metrics;
        }

        $metrics = $this->calculateUniversality($equilibria);
        $metrics = $this->calculateTopBeatsAndLosses($metrics, $payoffMatrix, $equilibria);
        $metrics = $this->addUsage($metrics, $equilibria);
        $metrics = $this->addExpectedValue($metrics, $equilibria, $payoffMatrix);

        return $metrics;
    }

    private function calculateUniversality(array $equilibria): array
    {
        $metrics = ['P1' => [], 'P2' => []];

        foreach (['P1', 'P2'] as $player) {
            $universalityScores = [];
            foreach ($equilibria as $eq) {
                foreach ($eq[$player] as $move => $prob) {
                    $universalityScores[$move][] = $prob;
                }
            }
            foreach ($universalityScores as $move => $values) {
                $metrics[$player][$move]['universality'] = array_sum($values) / count($values);
            }
        }

        return $metrics;
    }

    private function calculateTopBeatsAndLosses(array $metrics, array $payoffMatrix, array $equilibria): array
    {
        foreach ($equilibria as $eq) {
            // P1
            foreach ($eq['P1'] as $move => $_prob) {
                $bestOpp = $worstOpp = null;
                foreach ($payoffMatrix[$move] as $oppMove => $val) {
                    if ($bestOpp === null || $val > $payoffMatrix[$move][$bestOpp]) $bestOpp = $oppMove;
                    if ($worstOpp === null || $val < $payoffMatrix[$move][$worstOpp]) $worstOpp = $oppMove;
                }
                $metrics['P1'][$move]['topBeats'] = [$bestOpp];
                $metrics['P1'][$move]['topLosses'] = [$worstOpp];
            }

            // P2 (transpose perspective)
            foreach ($eq['P2'] as $move => $_prob) {
                $bestOpp = $worstOpp = null;
                foreach ($payoffMatrix as $p1Move => $row) {
                    $val = $row[$move];
                    if ($bestOpp === null || $val < $payoffMatrix[$bestOpp][$move]) $bestOpp = $p1Move;
                    if ($worstOpp === null || $val > $payoffMatrix[$worstOpp][$move]) $worstOpp = $p1Move;
                }
                $metrics['P2'][$move]['topBeats'] = [$bestOpp];
                $metrics['P2'][$move]['topLosses'] = [$worstOpp];
            }
        }

        return $metrics;
    }

    private function addUsage(array $metrics, array $equilibria): array
    {
        // Only take the first equilibrium
        $eq = $equilibria[0] ?? null;
        if (!$eq) return $metrics;

        foreach (['P1', 'P2'] as $player) {
            foreach ($eq[$player] as $move => $prob) {
                $metrics[$player][$move]['usage'] = $prob;
            }
        }

        return $metrics;
    }

    private function addExpectedValue(array $metrics, array $equilibria, array $payoffMatrix): array
    {
        $eq = $equilibria[0] ?? null;
        if (!$eq) return $metrics;

        $ev = 0;
        foreach ($payoffMatrix as $row => $cols) {
            foreach ($cols as $col => $val) {
                $rowProb = $eq['P1'][$row] ?? 0;
                $colProb = $eq['P2'][$col] ?? 0;
                $ev += $val * $rowProb * $colProb;
            }
        }

        // Attach EV to all moves for display purposes if needed
        foreach (['P1', 'P2'] as $player) {
            foreach ($metrics[$player] as $move => $_) {
                $metrics[$player][$move]['expectedValue'] = $ev;
            }
        }

        return $metrics;
    }
}
