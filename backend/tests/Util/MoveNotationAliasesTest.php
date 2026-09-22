<?php declare(strict_types=1);

namespace App\Tests\Util;

use App\Util\MoveNotationAliases;
use PHPUnit\Framework\TestCase;

final class MoveNotationAliasesTest extends TestCase
{
    public function testCanonicalizeExpandsFatDirectionAlternatives(): void
    {
        self::assertSame('4MP or 6MP', MoveNotationAliases::canonicalize('4 or 6MP'));
        self::assertSame('4+MK or 6+MK', MoveNotationAliases::canonicalize('4 or 6+MK'));
        self::assertSame('7HK or 9HK', MoveNotationAliases::canonicalize('7 or 9HK'));
        self::assertSame('1HK or 2HK or 3HK', MoveNotationAliases::canonicalize('1 or 2 or 3HK'));
    }

    public function testCanonicalizeLeavesEverythingElseUntouched(): void
    {
        foreach (['4MP or 6MP', '2MP', '5HP or 5HK (Monoid)', '236LPMP or LPHP', '4 or 6PPP or KKK', '214P/PP > 214LP or MP'] as $notation) {
            self::assertSame($notation, MoveNotationAliases::canonicalize($notation));
        }
    }

    public function testAlternativesListsStandaloneNotationsOnly(): void
    {
        self::assertSame(['4MP', '6MP'], MoveNotationAliases::alternatives('4MP or 6MP'));
        self::assertSame(['1HK', '2HK', '3HK'], MoveNotationAliases::alternatives('1HK or 2HK or 3HK'));
        self::assertSame([], MoveNotationAliases::alternatives('2MP'));
        self::assertSame([], MoveNotationAliases::alternatives('5HP or 5HK (Monoid)'));
        self::assertSame([], MoveNotationAliases::alternatives('236LPMP or LPHP'));
    }
}
