<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\Sf6ComboFrameLengthEstimatorService;
use App\Service\Sf6ComboResourceEstimatorService;
use PHPUnit\Framework\TestCase;

final class Sf6ComboResourceEstimatorServiceTest extends TestCase
{
    public function testEstimateBuildsDriveAndSuperValuesUsingOnHitDataAndPassiveRegen(): void
    {
        $service = new Sf6ComboResourceEstimatorService(new Sf6ComboFrameLengthEstimatorService());

        $result = $service->estimate([
            [
                'moveType' => 'normal',
                'notation' => '2LP',
                'driveGain' => 200,
                'onHitSelfSuperMeterGain' => 500,
                'startup' => 4,
                'active' => 3,
                'hitstop' => 10,
                'recovery' => 11,
                'connectionTypeName' => 'Initial Move',
            ],
            [
                'moveType' => 'super',
                'notation' => '236236P',
                'driveGain' => 100,
                'onHitSelfSuperMeterGain' => -10000,
                'startup' => 9,
                'active' => 4,
                'hitstop' => 12,
                'recovery' => 16,
                'connectionTypeName' => 'Special',
            ],
        ]);

        self::assertSame(60, $result['totalFrames']);
        self::assertSame(0.0, $result['driveUsed']);
        self::assertSame(0.27, $result['driveGain']);
        self::assertSame(0.0, $result['minimumDriveCost']);
        self::assertSame(0.1, $result['minimumDriveCostNoBurnout']);
        self::assertSame(1.0, $result['superUsed']);
        self::assertSame(0.05, $result['superGain']);
    }

    public function testEstimateTreatsNegativeDriveGainAsDriveUsed(): void
    {
        $service = new Sf6ComboResourceEstimatorService(new Sf6ComboFrameLengthEstimatorService());

        $result = $service->estimate([
            [
                'moveType' => 'special',
                'notation' => '236PP',
                'driveGain' => -20000,
                'onHitSelfSuperMeterGain' => 0,
                'startup' => 7,
                'active' => 4,
                'hitstop' => 12,
                'recovery' => 20,
                'connectionTypeName' => 'Special',
            ],
        ]);

        self::assertSame(2.0, $result['driveUsed']);
        self::assertSame(0.172, $result['driveGain']);
        self::assertSame(0.1, $result['minimumDriveCost']);
        self::assertSame(2.1, $result['minimumDriveCostNoBurnout']);
    }

    public function testEstimateAddsThreeDriveBarsForEachDriveRushCancel(): void
    {
        $service = new Sf6ComboResourceEstimatorService(new Sf6ComboFrameLengthEstimatorService());

        $result = $service->estimate([
            [
                'moveType' => 'normal',
                'notation' => '2LP',
                'driveGain' => 0,
                'onHitSelfSuperMeterGain' => 0,
                'startup' => 4,
                'active' => 3,
                'hitstop' => 10,
                'recovery' => 11,
                'connectionTypeName' => 'Initial Move',
            ],
            [
                'moveType' => 'normal',
                'notation' => '2LP',
                'driveGain' => 0,
                'onHitSelfSuperMeterGain' => 0,
                'startup' => 4,
                'active' => 3,
                'hitstop' => 10,
                'recovery' => 11,
                'connectionTypeName' => 'DR Cancel',
            ],
            [
                'moveType' => 'normal',
                'notation' => '2LP',
                'driveGain' => 0,
                'onHitSelfSuperMeterGain' => 0,
                'startup' => 4,
                'active' => 3,
                'hitstop' => 10,
                'recovery' => 11,
                'connectionTypeName' => 'DR Cancel',
            ],
        ]);

        self::assertSame(6.0, $result['driveUsed']);
    }

    public function testEstimateCalculatesMinimumDriveAcrossDriveSpendTimeline(): void
    {
        $service = new Sf6ComboResourceEstimatorService(new Sf6ComboFrameLengthEstimatorService());

        $result = $service->estimate([
            [
                'moveType' => 'normal',
                'notation' => '5MP',
                'driveGain' => 0,
                'onHitSelfSuperMeterGain' => 0,
                'startup' => 10,
                'active' => 5,
                'hitstop' => 10,
                'recovery' => 25,
                'connectionTypeName' => 'Initial Move',
            ],
            [
                'moveType' => 'drive',
                'notation' => 'Drive Rush',
                'driveGain' => -10000,
                'onHitSelfSuperMeterGain' => 0,
                'startup' => 0,
                'active' => 0,
                'hitstop' => 0,
                'recovery' => 0,
                'connectionTypeName' => 'Link',
            ],
            [
                'moveType' => 'normal',
                'notation' => '5HP',
                'driveGain' => 0,
                'onHitSelfSuperMeterGain' => 0,
                'startup' => 10,
                'active' => 5,
                'hitstop' => 10,
                'recovery' => 25,
                'connectionTypeName' => 'Link',
            ],
            [
                'moveType' => 'normal',
                'notation' => '2MP',
                'driveGain' => 0,
                'onHitSelfSuperMeterGain' => 0,
                'startup' => 8,
                'active' => 3,
                'hitstop' => 10,
                'recovery' => 20,
                'connectionTypeName' => 'DR Cancel',
            ],
        ]);

        self::assertSame(4.0, $result['driveUsed']);
        self::assertSame(0.4, $result['driveGain']);
        self::assertSame(0.9, $result['minimumDriveCost']);
        self::assertSame(3.7, $result['minimumDriveCostNoBurnout']);
    }

    public function testEstimateStopsDriveGainFromDriveRushCancelOnward(): void
    {
        $service = new Sf6ComboResourceEstimatorService(new Sf6ComboFrameLengthEstimatorService());

        $result = $service->estimate([
            [
                'moveType' => 'normal',
                'notation' => '5MP',
                'driveGain' => 0,
                'onHitSelfSuperMeterGain' => 0,
                'startup' => 10,
                'active' => 0,
                'hitstop' => 0,
                'recovery' => 0,
                'connectionTypeName' => 'Initial Move',
            ],
            [
                'moveType' => 'normal',
                'notation' => '5HP',
                'driveGain' => 0,
                'onHitSelfSuperMeterGain' => 0,
                'startup' => 10,
                'active' => 0,
                'hitstop' => 0,
                'recovery' => 0,
                'connectionTypeName' => 'DR Cancel',
            ],
            [
                'moveType' => 'normal',
                'notation' => '2MP',
                'driveGain' => 0,
                'onHitSelfSuperMeterGain' => 0,
                'startup' => 10,
                'active' => 0,
                'hitstop' => 0,
                'recovery' => 0,
                'connectionTypeName' => 'Link',
            ],
        ]);

        self::assertSame(3.0, $result['driveUsed']);
        self::assertSame(0.04, $result['driveGain']);
    }

    public function testEstimateDoesNotStopDriveGainAfterRawDriveRush(): void
    {
        $service = new Sf6ComboResourceEstimatorService(new Sf6ComboFrameLengthEstimatorService());

        $result = $service->estimate([
            [
                'moveType' => 'drive',
                'notation' => 'Drive Rush',
                'driveGain' => -10000,
                'onHitSelfSuperMeterGain' => 0,
                'startup' => 0,
                'active' => 0,
                'hitstop' => 0,
                'recovery' => 0,
                'connectionTypeName' => 'Initial Move',
            ],
            [
                'moveType' => 'normal',
                'notation' => '5HP',
                'driveGain' => 0,
                'onHitSelfSuperMeterGain' => 0,
                'startup' => 10,
                'active' => 0,
                'hitstop' => 0,
                'recovery' => 0,
                'connectionTypeName' => 'Link',
            ],
        ]);

        self::assertSame(1.0, $result['driveUsed']);
        self::assertSame(0.04, $result['driveGain']);
    }

    public function testEstimateIgnoresPositiveDriveGainAfterDrcButKeepsDriveCosts(): void
    {
        $service = new Sf6ComboResourceEstimatorService(new Sf6ComboFrameLengthEstimatorService());

        $result = $service->estimate([
            [
                'moveType' => 'normal',
                'notation' => '5MP',
                'driveGain' => 0,
                'onHitSelfSuperMeterGain' => 0,
                'startup' => 10,
                'active' => 0,
                'hitstop' => 0,
                'recovery' => 0,
                'connectionTypeName' => 'Initial Move',
            ],
            [
                'moveType' => 'normal',
                'notation' => '5HP',
                'driveGain' => 500,
                'onHitSelfSuperMeterGain' => 0,
                'startup' => 10,
                'active' => 0,
                'hitstop' => 0,
                'recovery' => 0,
                'connectionTypeName' => 'DR Cancel',
            ],
            [
                'moveType' => 'drive',
                'notation' => 'OD Fireball',
                'driveGain' => -10000,
                'onHitSelfSuperMeterGain' => 0,
                'startup' => 10,
                'active' => 0,
                'hitstop' => 0,
                'recovery' => 0,
                'connectionTypeName' => 'Special',
            ],
        ]);

        self::assertSame(4.0, $result['driveUsed']);
        self::assertSame(0.04, $result['driveGain']);
    }

    public function testEstimateReactivatesDriveGainFromLevelThreeSuperAfterDrc(): void
    {
        $service = new Sf6ComboResourceEstimatorService(new Sf6ComboFrameLengthEstimatorService());

        $result = $service->estimate([
            [
                'moveType' => 'normal',
                'notation' => '5MP',
                'driveGain' => 0,
                'onHitSelfSuperMeterGain' => 0,
                'startup' => 10,
                'active' => 0,
                'hitstop' => 0,
                'recovery' => 0,
                'connectionTypeName' => 'Initial Move',
            ],
            [
                'moveType' => 'normal',
                'notation' => '5HP',
                'driveGain' => 0,
                'onHitSelfSuperMeterGain' => 0,
                'startup' => 10,
                'active' => 0,
                'hitstop' => 0,
                'recovery' => 0,
                'connectionTypeName' => 'DR Cancel',
            ],
            [
                'moveType' => 'super',
                'notation' => 'SA3',
                'driveGain' => 0,
                'onHitSelfSuperMeterGain' => 0,
                'startup' => 10,
                'active' => 0,
                'hitstop' => 0,
                'recovery' => 0,
                'connectionTypeName' => 'Link',
            ],
            [
                'moveType' => 'normal',
                'notation' => '2MP',
                'driveGain' => 250,
                'onHitSelfSuperMeterGain' => 0,
                'startup' => 10,
                'active' => 0,
                'hitstop' => 0,
                'recovery' => 0,
                'connectionTypeName' => 'Link',
            ],
        ]);

        self::assertSame(3.0, $result['driveUsed']);
        self::assertSame(0.145, $result['driveGain']);
        self::assertSame(3.0, $result['superUsed']);
    }

    public function testEstimateRequiresEnoughDriveToAvoidBurnoutBeforeFutureDriveSpend(): void
    {
        $service = new Sf6ComboResourceEstimatorService(new Sf6ComboFrameLengthEstimatorService());

        $result = $service->estimate([
            [
                'moveType' => 'drive',
                'notation' => 'Drive Rush',
                'driveGain' => -10000,
                'onHitSelfSuperMeterGain' => 0,
                'startup' => 0,
                'active' => 0,
                'hitstop' => 0,
                'recovery' => 0,
                'connectionTypeName' => 'Initial Move',
            ],
            [
                'moveType' => 'normal',
                'notation' => '5HP',
                'driveGain' => 0,
                'onHitSelfSuperMeterGain' => 0,
                'startup' => 10,
                'active' => 5,
                'hitstop' => 10,
                'recovery' => 25,
                'connectionTypeName' => 'Link',
            ],
            [
                'moveType' => 'drive',
                'notation' => 'OD Fireball',
                'driveGain' => -20000,
                'onHitSelfSuperMeterGain' => 0,
                'startup' => 0,
                'active' => 0,
                'hitstop' => 0,
                'recovery' => 0,
                'connectionTypeName' => 'Special',
            ],
        ]);

        self::assertSame(1.1, $result['minimumDriveCost']);
        self::assertSame(2.9, $result['minimumDriveCostNoBurnout']);
    }

    public function testEstimateReturnsNullWhenNoBurnoutRouteRequiresMoreThanFullDrive(): void
    {
        $service = new Sf6ComboResourceEstimatorService(new Sf6ComboFrameLengthEstimatorService());

        $result = $service->estimate([
            [
                'moveType' => 'drive',
                'notation' => 'Expensive Sequence',
                'driveGain' => -70000,
                'onHitSelfSuperMeterGain' => 0,
                'startup' => 0,
                'active' => 0,
                'hitstop' => 0,
                'recovery' => 0,
                'connectionTypeName' => 'Initial Move',
            ],
        ]);

        self::assertSame(0.1, $result['minimumDriveCost']);
        self::assertNull($result['minimumDriveCostNoBurnout']);
    }
}
