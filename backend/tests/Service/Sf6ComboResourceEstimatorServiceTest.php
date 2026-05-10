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
        self::assertSame(1.0, $result['superUsed']);
        self::assertSame(0.05, $result['superGain']);
    }
}
