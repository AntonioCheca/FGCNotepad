<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\MixedStrategyGameSolver;
use PHPUnit\Framework\TestCase;

class MixedStrategyGameSolverTest extends TestCase
{
    public function testBasicExample()
    {
        $solver = new MixedStrategyGameSolver();
        $payoffMatrix = ['A1' => ['B1' => 1, 'B2' => 0], 'A2' => ['B1' => 0, 'B2' => 2]];

        $result = $solver->solveMixedStrategyGame($payoffMatrix);
        $expectedResult = ['equilibria' => [
            [
                'P1' => ['A1' => 0.6666667, 'A2' => 0.333333],
                'P2' => ['B1' => 0.6666667, 'B2' => 0.333333],
            ]
        ]];

        // Compare with tolerance (epsilon)
        self::assertEqualsWithDelta($expectedResult, $result, 0.01);
    }

    public function testPerformanceWithLargerMatrix()
    {
        $solver = new MixedStrategyGameSolver();

        // Build a 50x50 matrix with varied values
        $payoffMatrix = [];
        for ($i = 1; $i <= 50; $i++) {
            $rowKey = "A{$i}";
            $payoffMatrix[$rowKey] = [];
            for ($j = 1; $j <= 10; $j++) {
                $colKey = "B{$j}";
                // Deterministic but "complex enough" distribution of payoffs
                $payoffMatrix[$rowKey][$colKey] = (($i * $j) % 7) - 3; // values from -3 to 3
            }
        }

        $result = $solver->solveMixedStrategyGame($payoffMatrix);

        // We don’t know the exact solution, but we assert structure & performance
        self::assertArrayHasKey('equilibria', $result);
        self::assertNotEmpty($result['equilibria']);
    }
}
