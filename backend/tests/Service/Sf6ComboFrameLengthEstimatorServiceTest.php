<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\Sf6ComboFrameLengthEstimatorService;
use PHPUnit\Framework\TestCase;

final class Sf6ComboFrameLengthEstimatorServiceTest extends TestCase
{
    public function testEstimateSubtractsStartupOnChainAndSpecialCancelConnections(): void
    {
        $service = new Sf6ComboFrameLengthEstimatorService();

        $result = $service->estimate([
            ['startup' => 5, 'active' => 3, 'hitstop' => 10, 'recovery' => 12, 'connectionTypeName' => 'Initial Move'],
            ['startup' => 7, 'active' => 2, 'hitstop' => 8, 'recovery' => 15, 'connectionTypeName' => 'Chain'],
            ['startup' => 12, 'active' => 4, 'hitstop' => 9, 'recovery' => 18, 'connectionTypeName' => 'Special'],
        ]);

        self::assertSame([30, 25, 31], $result['stepFrames']);
        self::assertSame(86, $result['totalFrames']);
    }
}
