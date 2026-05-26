<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\MixedStrategyGameSolver;
use PHPUnit\Framework\TestCase;

class MixedStrategyGameSolverTest extends TestCase
{
    public function testBasicExample(): void
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

    public function testPerformanceWithLargerMatrix(): void
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

    public function testDerivedMetricsAreCalculated(): void
    {
        $solver = new MixedStrategyGameSolver();
        $payoffMatrix = [
            'A1' => ['B1' => 1, 'B2' => 0],
            'A2' => ['B1' => 0, 'B2' => 2]
        ];

        $result = $solver->solveMixedStrategyGame($payoffMatrix);
        self::assertArrayHasKey('derivedMetrics', $result);

        $metrics = $result['derivedMetrics'];

        self::assertEqualsWithDelta(2 / 3, $metrics['P1']['A1']['universality'], 0.01);
        self::assertEqualsWithDelta(1 / 3, $metrics['P1']['A2']['universality'], 0.01);
        self::assertEqualsWithDelta(2 / 3, $metrics['P2']['B1']['universality'], 0.01);
        self::assertEqualsWithDelta(1 / 3, $metrics['P2']['B2']['universality'], 0.01);

        self::assertEquals(['B1'], $metrics['P1']['A1']['topBeats']);
        self::assertEquals(['B2'], $metrics['P1']['A1']['topLosses']);
        self::assertEquals(['B2'], $metrics['P1']['A2']['topBeats']);
        self::assertEquals(['B1'], $metrics['P1']['A2']['topLosses']);

        self::assertEquals(['A2'], $metrics['P2']['B1']['topBeats']);
        self::assertEquals(['A1'], $metrics['P2']['B1']['topLosses']);
        self::assertEquals(['A1'], $metrics['P2']['B2']['topBeats']);
        self::assertEquals(['A2'], $metrics['P2']['B2']['topLosses']);
    }
}
