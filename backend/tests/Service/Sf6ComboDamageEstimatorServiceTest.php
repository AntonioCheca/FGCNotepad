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

    public function testEstimateAppliesDriveRushCancelScalingFromConnectedMove(): void
    {
        $result = $this->service->estimate([
            ['damage' => 1000, 'moveType' => 'normal', 'notation' => '5MP', 'connectionTypeName' => 'Initial Move'],
            ['damage' => 1000, 'moveType' => 'normal', 'notation' => '5MP', 'connectionTypeName' => 'DR Cancel'],
            ['damage' => 1000, 'moveType' => 'normal', 'notation' => '5MP', 'connectionTypeName' => 'Link'],
        ]);

        self::assertSame([1000, 850, 680], $result['stepDamages']);
        self::assertSame(2530, $result['estimatedDamage']);
    }

    public function testEstimateAppliesCounterStarterDamageBonus(): void
    {
        $result = $this->service->estimate([
            ['damage' => 600, 'moveType' => 'normal', 'notation' => '2MP'],
            ['damage' => 900, 'moveType' => 'normal', 'notation' => '2HK'],
        ], [
            'starterHitState' => 'punish_counter',
        ]);

        self::assertSame([720, 900], $result['stepDamages']);
        self::assertSame(1620, $result['estimatedDamage']);
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

    public function testEstimateScalesCompositeDamagePartsIndividually(): void
    {
        $result = $this->service->estimate([
            ['damage' => 600, 'moveType' => 'normal', 'notation' => '2MP'],
            ['damage' => 1300, 'moveType' => 'normal', 'notation' => '5MP > MP', 'scalingComboHits' => 2, 'damageParts' => [600, 700]],
            ['damage' => 1500, 'moveType' => 'special', 'notation' => '623HP', 'scalingStartPercent' => 20],
        ]);

        self::assertSame([600, 1160, 900], $result['stepDamages']);
        self::assertSame(2660, $result['estimatedDamage']);
    }

    public function testEstimateDoesNotApplyExtraComboHitPenaltyFromStarter(): void
    {
        $result = $this->service->estimate([
            ['damage' => 800, 'moveType' => 'normal', 'notation' => '5HK', 'scalingComboHits' => 2],
            ['damage' => 700, 'moveType' => 'normal', 'notation' => '5MK'],
            ['damage' => 600, 'moveType' => 'special', 'notation' => '214LK', 'scalingComboHits' => 2],
            ['damage' => 900, 'moveType' => 'normal', 'notation' => '2HK'],
        ]);

        self::assertSame([800, 700, 480, 540], $result['stepDamages']);
        self::assertSame(2520, $result['estimatedDamage']);
    }

    public function testEstimateDoesNotSplitNormalDamageParentheticalParts(): void
    {
        $result = $this->service->estimate([
            ['damage' => 800, 'moveType' => 'normal', 'notation' => '5HK', 'scalingComboHits' => 2],
            ['damage' => 700, 'moveType' => 'normal', 'notation' => '5MK'],
            ['damage' => 600, 'moveType' => 'special', 'notation' => '214LK', 'scalingComboHits' => 2],
            ['damage' => 1500, 'moveType' => 'special', 'notation' => '623HP', 'scalingStartPercent' => 20],
        ]);

        self::assertSame([800, 700, 480, 900], $result['stepDamages']);
        self::assertSame(2880, $result['estimatedDamage']);
    }

    public function testEstimateAdvancesScalingForCompositeStarterDamageParts(): void
    {
        $result = $this->service->estimate([
            ['damage' => 1400, 'moveType' => 'normal', 'notation' => '6HP > 6HP', 'damageParts' => [800, 600]],
            ['damage' => 1300, 'moveType' => 'special', 'notation' => '623MP', 'scalingStartPercent' => 20],
        ]);

        self::assertSame([1400, 1040], $result['stepDamages']);
        self::assertSame(2440, $result['estimatedDamage']);
    }

    public function testEstimateAppliesStarterScalingPenaltyToFollowingMove(): void
    {
        $result = $this->service->estimate([
            ['damage' => 800, 'moveType' => 'normal', 'notation' => '4HK', 'scalingStartPercent' => 20],
            ['damage' => 1300, 'moveType' => 'special', 'notation' => '236K > P'],
        ]);

        self::assertSame([800, 1040], $result['stepDamages']);
        self::assertSame(1840, $result['estimatedDamage']);
    }

    public function testEstimateUsesStarterScalingTableBeyondSecondHit(): void
    {
        $result = $this->service->estimate([
            ['damage' => 800, 'moveType' => 'normal', 'notation' => '4HK', 'scalingStartPercent' => 20],
            ['damage' => 700, 'moveType' => 'special', 'notation' => '236K > K', 'scalingStartPercent' => 30, 'scalingComboHits' => 2],
            ['damage' => 1500, 'moveType' => 'special', 'notation' => '623HP', 'scalingStartPercent' => 20],
        ]);

        self::assertSame([800, 560, 900], $result['stepDamages']);
        self::assertSame(2260, $result['estimatedDamage']);
    }

    public function testEstimateAppliesComboExtraPercentToNextHitWithoutComboHits(): void
    {
        $result = $this->service->estimate([
            ['damage' => 800, 'moveType' => 'normal', 'notation' => '5HP'],
            ['damage' => 1500, 'moveType' => 'special', 'notation' => '214HP > 6P', 'scalingComboExtraPercent' => 20, 'damageParts' => [900, 600]],
            ['damage' => 1600, 'moveType' => 'special', 'notation' => '214HK'],
        ]);

        self::assertSame([800, 1380, 800], $result['stepDamages']);
        self::assertSame(2980, $result['estimatedDamage']);
    }
}
