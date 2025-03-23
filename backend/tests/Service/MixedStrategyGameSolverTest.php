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

        self::assertEqualsWithDelta($expectedResult, $result, 0.0001);
    }
}
