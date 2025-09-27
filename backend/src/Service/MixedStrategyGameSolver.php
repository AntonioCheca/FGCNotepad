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

        $result = $this->runPythonScript($scriptPath, [$jsonMatrix]);

        // Post-process into derived metrics
        $result['derivedMetrics'] = $this->calculateDerivedMetrics($result, $payoffMatrix);

        return $result;
    }

    /**
     * @param array<string> $arguments
     * @return array<string, mixed>
     */
    private function runPythonScript(string $scriptPath, array $arguments): array
    {
        $process = new Process(array_merge(['python', $scriptPath], $arguments));
        $process->run();

        if (!$process->isSuccessful()) {
            throw new ProcessFailedException($process);
        }

        $output = $process->getOutput();
        $decodedOutput = json_decode($output, true);

        if ($decodedOutput === null) {
            throw new \RuntimeException('Failed to decode JSON response from Python script.');
        }

        return $decodedOutput;
    }

    /**
     * Compute UniversalityScore, TopBeats, TopLosses for both P1 and P2.
     *
     * @param array<string, mixed> $solverResult
     * @param array<string, array<string, int>> $payoffMatrix
     * @return array<string, mixed>
     */
    private function calculateDerivedMetrics(array $solverResult, array $payoffMatrix): array
    {
        $metrics = ['P1' => [], 'P2' => []];
        $equilibria = $solverResult['equilibria'] ?? [];

        if (empty($equilibria)) {
            return $metrics;
        }

        // Universality scores
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

        // TopBeats & TopLosses
        foreach ($equilibria as $eq) {
            // For P1: evaluate against each B move
            foreach ($eq['P1'] as $move => $_prob) {
                $bestOpp = null;
                $worstOpp = null;
                foreach ($payoffMatrix[$move] as $oppMove => $val) {
                    if ($bestOpp === null || $val > $payoffMatrix[$move][$bestOpp]) {
                        $bestOpp = $oppMove;
                    }
                    if ($worstOpp === null || $val < $payoffMatrix[$move][$worstOpp]) {
                        $worstOpp = $oppMove;
                    }
                }
                $metrics['P1'][$move]['topBeats'] = [$bestOpp];
                $metrics['P1'][$move]['topLosses'] = [$worstOpp];
            }

            // For P2: transpose perspective
            foreach ($eq['P2'] as $move => $_prob) {
                $bestOpp = null;
                $worstOpp = null;
                foreach ($payoffMatrix as $p1Move => $row) {
                    $val = $row[$move];
                    if ($bestOpp === null || $val < $payoffMatrix[$bestOpp][$move]) {
                        $bestOpp = $p1Move; // minimizing, since payoff is for P1
                    }
                    if ($worstOpp === null || $val > $payoffMatrix[$worstOpp][$move]) {
                        $worstOpp = $p1Move;
                    }
                }
                $metrics['P2'][$move]['topBeats'] = [$bestOpp];
                $metrics['P2'][$move]['topLosses'] = [$worstOpp];
            }
        }

        return $metrics;
    }
}
