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

    public function testGetFullDataAsArrayIncludesNormalizedScalingFields(): void
    {
        $frameData = (new FrameData())
            ->setScaling('20% Start / Combo (2 hits)')
            ->setScalingStartPercent(20)
            ->setScalingComboHits(2)
            ->setScalingParseStatus('parsed')
            ->setScalingParseNote(null);

        $full = $frameData->getFullDataAsArray();

        self::assertArrayHasKey('scaling_start_percent', $full);
        self::assertArrayHasKey('scaling_immediate_percent', $full);
        self::assertArrayHasKey('scaling_minimum_percent', $full);
        self::assertArrayHasKey('scaling_combo_hits', $full);
        self::assertArrayHasKey('scaling_combo_extra_percent', $full);
        self::assertArrayHasKey('scaling_multiplier_percent', $full);
        self::assertArrayHasKey('scaling_parse_status', $full);
        self::assertArrayHasKey('scaling_parse_note', $full);
        self::assertSame(20, $full['scaling_start_percent']);
        self::assertSame(2, $full['scaling_combo_hits']);
        self::assertSame('parsed', $full['scaling_parse_status']);
    }
}
