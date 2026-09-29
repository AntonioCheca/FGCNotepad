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

    /** @dataProvider blockedDriveImpactStunNotations */
    public function testExtractsBlockedDriveImpactStunStarter(string $notation, ?string $hitState): void
    {
        $result = (new ComboStarterModifierExtractor())->extract($notation);

        self::assertSame('5HP, 214LP', $result['notation']);
        self::assertTrue($result['blockedDriveImpactStun']);
        self::assertTrue($result['requirements']['blocked_drive_impact_stun_required']);
        self::assertSame($hitState, $result['starterHitState']);
    }

    /** @return iterable<string, array{0: string, 1: string|null}> */
    public static function blockedDriveImpactStunNotations(): iterable
    {
        yield 'prefix with colon' => ['Bl-DI-St: 5HP, 214LP', null];
        yield 'prefix with space' => ['bl-di-st 5HP, 214LP', null];
        yield 'combined with a hit state' => ['Bl-DI-St+PC 5HP, 214LP', ComboStarterModifierExtractor::STARTER_HIT_STATE_PUNISH_COUNTER];
    }

    public function testNotationWithoutBlockedDriveImpactStunKeepsItOff(): void
    {
        $result = (new ComboStarterModifierExtractor())->extract('CH 5HP, 214LP');

        self::assertFalse($result['blockedDriveImpactStun']);
        self::assertFalse($result['requirements']['blocked_drive_impact_stun_required']);
    }

    /** @dataProvider perfectParryNotations */
    public function testPerfectParryTagImpliesPunishCounter(string $notation): void
    {
        $result = (new ComboStarterModifierExtractor())->extract($notation);

        self::assertSame('5HP, 214LP', $result['notation']);
        self::assertTrue($result['perfectParry']);
        self::assertSame(ComboStarterModifierExtractor::STARTER_HIT_STATE_PUNISH_COUNTER, $result['starterHitState']);
        self::assertTrue($result['requirements']['perfect_parry_required']);
        self::assertTrue($result['requirements']['punish_counter_required']);
        self::assertFalse($result['requirements']['counter_hit_required']);
    }

    /** @return iterable<string, array{string}> */
    public static function perfectParryNotations(): iterable
    {
        yield 'leading' => ['PP 5HP, 214LP'];
        yield 'leading with PC' => ['PP+PC 5HP, 214LP'];
        yield 'leading long form' => ['Perfect Parry > 5HP, 214LP'];
        yield 'after first move' => ['5HP (PP), 214LP'];
    }

    public function testPlainNotationHasNoPerfectParry(): void
    {
        $result = (new ComboStarterModifierExtractor())->extract('5HP, 214+PP');

        self::assertSame('5HP, 214+PP', $result['notation']);
        self::assertFalse($result['perfectParry']);
        self::assertNull($result['starterHitState']);
    }
}
