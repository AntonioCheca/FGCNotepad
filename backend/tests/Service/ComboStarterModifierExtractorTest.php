<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\ComboStarterModifierExtractor;
use PHPUnit\Framework\TestCase;

final class ComboStarterModifierExtractorTest extends TestCase
{
    public function testExtractsPunishCounterAfterFirstMove(): void
    {
        $result = (new ComboStarterModifierExtractor())->extract('cr. mp (pc), cr. hk');

        self::assertSame('cr. mp, cr. hk', $result['notation']);
        self::assertSame(ComboStarterModifierExtractor::STARTER_HIT_STATE_PUNISH_COUNTER, $result['starterHitState']);
        self::assertFalse($result['requirements']['counter_hit_required']);
        self::assertTrue($result['requirements']['punish_counter_required']);
    }

    public function testExtractsLeadingCounterHit(): void
    {
        $result = (new ComboStarterModifierExtractor())->extract('CH cr. mp, cr. hk');

        self::assertSame('cr. mp, cr. hk', $result['notation']);
        self::assertSame(ComboStarterModifierExtractor::STARTER_HIT_STATE_COUNTER_HIT, $result['starterHitState']);
        self::assertTrue($result['requirements']['counter_hit_required']);
        self::assertFalse($result['requirements']['punish_counter_required']);
    }
}
