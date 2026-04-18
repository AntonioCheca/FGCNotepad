<?php declare(strict_types=1);

namespace App\Service;

use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class MixedStrategyGameSolver
{
    private const PYTHON_SCRIPT_PATH = __DIR__ . '/python_scripts/';
    private const SCRIPTS = [
        'SOLVE_MIXED_STRATEGY' => 'solve_mixed_strategy_game.py',
        'MWU_SOLVER' => 'mwu_solver.py'
    ];

    /**
     * @param array<string, array<string, int>> $payoffMatrix
     * @return array<string, mixed>
     */
    public function solveMixedStrategyGame(array $payoffMatrix): array
    {
        $scriptPath = self::PYTHON_SCRIPT_PATH . self::SCRIPTS['MWU_SOLVER'];
        $jsonMatrix = json_encode($payoffMatrix);

        if ($jsonMatrix === false) {
            throw new \RuntimeException('Failed to encode matrix to JSON.');
        }

        $result = $this->runPythonScript($scriptPath, $jsonMatrix);

        // Post-process derived metrics
        $result['derivedMetrics'] = $this->calculateAllMetrics($result, $payoffMatrix);

        return $result;
    }

    private function runPythonScript(string $scriptPath, string $inputJson): array
    {
        $process = new Process(['python', $scriptPath]);
        $process->setInput($inputJson);
        $process->run();

        if (!$process->isSuccessful()) {
            throw new ProcessFailedException($process);
        }

        $decodedOutput = json_decode($process->getOutput(), true);
        if ($decodedOutput === null) {
            throw new \RuntimeException('Failed to decode JSON response from Python script.');
        }

        return $decodedOutput;
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
