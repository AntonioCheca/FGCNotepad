<?php declare(strict_types=1);

namespace App\Service;

use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class MixedStrategyGameSolver
{
    private const PYTHON_SCRIPT_PATH = __DIR__ . '/python_scripts/';
    private const SCRIPTS = ['SOLVE_MIXED_STRATEGY' => 'solve_mixed_strategy_game.py',
        'MWU_SOLVER' => 'mwu_solver.py'];

    /**
     * @param array<string, list<array<string, list<array<string, int>>>>> $payoffMatrix
     * @return array<string, list<array<string, list<array<string, int>>>>>
     */
    public function solveMixedStrategyGame(array $payoffMatrix): array
    {
        $scriptPath = self::PYTHON_SCRIPT_PATH . self::SCRIPTS['MWU_SOLVER'];
        $jsonMatrix = json_encode($payoffMatrix);

        if ($jsonMatrix === false) {
            throw new \RuntimeException('Failed to encode matrix to JSON.');
        }

        return $this->runPythonScript($scriptPath, [$jsonMatrix]);
    }

    /**
     * @param array<string> $arguments
     * @return array<string, list<array<string, list<array<string, int>>>>>
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
}
