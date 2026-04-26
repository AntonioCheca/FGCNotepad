<?php declare(strict_types=1);

namespace App\Tests\Entity;

use App\Entity\FrameData;
use App\Util\Enum\CancelType;
use PHPUnit\Framework\TestCase;

class FrameDataTest extends TestCase
{
    public function testGetCancelTypesParsesJsonCodes(): void
    {
        $frameData = (new FrameData())->setCancelsTo('["ch","sp","su","tc"]');

        self::assertSame(['ch', 'sp', 'su', 'tc'], $frameData->getCancelTypeCodes());
        self::assertTrue($frameData->hasCancelType(CancelType::CHAIN));
        self::assertFalse($frameData->hasCancelType(CancelType::SUPER_2));
    }

    public function testGetCancelTypesIgnoresUnknownAndDuplicateCodes(): void
    {
        $frameData = (new FrameData())->setCancelsTo('["CH","sp","sp","invalid","su3"]');

        self::assertSame(['ch', 'sp', 'su3'], $frameData->getCancelTypeCodes());
    }
}
