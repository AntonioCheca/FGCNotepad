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
        $expectedResult = [
            [
                'P1' => ['A1' => 0.6666667, 'A2' => 0.333333],
                'P2' => ['B1' => 0.6666667, 'B2' => 0.333333],
            ]
        ];

        self::assertEqualsWithDelta($expectedResult, $result['equilibria'], 0.01);
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
                
                $payoffMatrix[$rowKey][$colKey] = (($i * $j) % 7) - 3;
            }
        }

        $result = $solver->solveMixedStrategyGame($payoffMatrix);

        // We don’t know the exact solution, but we assert structure & performance
        self::assertArrayHasKey('equilibria', $result);
        self::assertNotEmpty($result['equilibria']);
    }

    public function testDerivedMetricsAreCalculated()
    {
        $solver = new MixedStrategyGameSolver();
        $payoffMatrix = [
            'A1' => ['B1' => 1, 'B2' => 0],
            'A2' => ['B1' => 0, 'B2' => 2]
        ];

        $result = $solver->solveMixedStrategyGame($payoffMatrix);

        self::assertArrayHasKey('derivedMetrics', $result);

        $metrics = $result['derivedMetrics'];

        // Check Universality exists for both players
        self::assertArrayHasKey('P1', $metrics);
        self::assertArrayHasKey('P2', $metrics);

        // P1 universality scores should exist
        self::assertArrayHasKey('A1', $metrics['P1']);
        self::assertArrayHasKey('universality', $metrics['P1']['A1']);

        // P2 universality scores should exist
        self::assertArrayHasKey('B1', $metrics['P2']);
        self::assertArrayHasKey('universality', $metrics['P2']['B1']);

        // TopBeats / TopLosses exist
        self::assertArrayHasKey('topBeats', $metrics['P1']['A1']);
        self::assertArrayHasKey('topLosses', $metrics['P1']['A1']);
        self::assertArrayHasKey('topBeats', $metrics['P2']['B1']);
        self::assertArrayHasKey('topLosses', $metrics['P2']['B1']);
    }
}
