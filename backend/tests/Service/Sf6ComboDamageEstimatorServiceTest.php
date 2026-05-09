<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\Sf6ComboDamageEstimatorService;
use PHPUnit\Framework\TestCase;

final class Sf6ComboDamageEstimatorServiceTest extends TestCase
{
    private Sf6ComboDamageEstimatorService $service;

    protected function setUp(): void
    {
        $this->service = new Sf6ComboDamageEstimatorService();
    }

    public function testEstimateUsesLightStarterTable(): void
    {
        $result = $this->service->estimate([
            ['damage' => 300, 'moveType' => 'normal', 'notation' => '5LP'],
            ['damage' => 300, 'moveType' => 'normal', 'notation' => '2LK'],
            ['damage' => 400, 'moveType' => 'normal', 'notation' => '2LP'],
            ['damage' => 1200, 'moveType' => 'special', 'notation' => '623HP'],
        ]);

        self::assertSame([300, 240, 280, 720], $result['stepDamages']);
        self::assertSame(1540, $result['estimatedDamage']);
    }

    public function testEstimateAppliesPerfectParryAndDriveRushMultipliers(): void
    {
        $result = $this->service->estimate([
            ['damage' => 1000, 'moveType' => 'normal', 'notation' => '5MP'],
            ['damage' => 1000, 'moveType' => 'normal', 'notation' => '5MP'],
        ], [
            'perfectParry' => true,
            'driveRushMidCombo' => true,
        ]);

        self::assertSame([420, 420], $result['stepDamages']);
        self::assertSame(840, $result['estimatedDamage']);
    }

    public function testEstimateAppliesSuperMinimumFloorWhenLevelKnown(): void
    {
        $moves = [];
        for ($index = 0; $index < 9; $index++) {
            $moves[] = ['damage' => 100, 'moveType' => 'normal', 'notation' => '5MP'];
        }
        $moves[] = ['damage' => 4000, 'moveType' => 'super', 'notation' => '236236P'];

        $result = $this->service->estimate($moves, [
            'superArtLevels' => [10 => 3],
        ]);

        self::assertSame(2000, $result['stepDamages'][9]);
    }

    public function testEstimateAppliesMoveSpecificComboHitsPenaltyForFollowingMoves(): void
    {
        $result = $this->service->estimate([
            ['damage' => 300, 'moveType' => 'normal', 'notation' => '2LP', 'scalingStartPercent' => 20],
            ['damage' => 300, 'moveType' => 'normal', 'notation' => '2LP', 'scalingStartPercent' => 20],
            ['damage' => 300, 'moveType' => 'normal', 'notation' => '5LK', 'scalingStartPercent' => 20],
            ['damage' => 600, 'moveType' => 'special', 'notation' => '214LK', 'scalingComboHits' => 2],
            ['damage' => 900, 'moveType' => 'normal', 'notation' => '2HK'],
        ]);

        self::assertSame([300, 240, 210, 360, 360], $result['stepDamages']);
        self::assertSame(1470, $result['estimatedDamage']);
    }

    public function testEstimateAppliesMoveSpecificMinimumAndMultiplierColumns(): void
    {
        $result = $this->service->estimate([
            ['damage' => 1000, 'moveType' => 'normal', 'notation' => '5MP', 'scalingMultiplierPercent' => 50],
            ['damage' => 1000, 'moveType' => 'normal', 'notation' => '5MP', 'scalingImmediatePercent' => 20],
            ['damage' => 1000, 'moveType' => 'normal', 'notation' => '5MP', 'scalingMinimumPercent' => 40],
        ]);

        self::assertSame([500, 200, 800], $result['stepDamages']);
        self::assertSame(1500, $result['estimatedDamage']);
    }
}
