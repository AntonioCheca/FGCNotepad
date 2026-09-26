<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\NeutralMoveFamilyClassifier;
use PHPUnit\Framework\TestCase;

final class NeutralMoveFamilyClassifierTest extends TestCase
{
    /** @dataProvider families */
    public function testClassifiesNeutralMoves(string $route, string $notation, ?string $moveType, ?string $category, string $family, bool $isOd): void
    {
        $classifier = new NeutralMoveFamilyClassifier();

        $actual = $classifier->family($route, $notation, $moveType, $category);

        self::assertSame($family, $actual);
        self::assertSame($isOd, $classifier->isOd($actual, $notation));
    }

    /** @return iterable<string, array{string, string, string|null, string|null, string, bool}> */
    public static function families(): iterable
    {
        yield 'light normal' => ['raw', '2LK', 'normal', null, 'light', false];
        yield 'light command normal' => ['raw', '6LP', 'normal', null, 'light', false];
        yield 'medium normal' => ['raw', '3MK', 'normal', null, 'medium', false];
        yield 'heavy normal' => ['raw', '4HP', 'normal', null, 'heavy', false];
        yield 'drive rush wins over strength' => ['drive_rush', '5HP', 'normal', null, 'drive_rush', false];
        yield 'special' => ['raw', '236LK', 'special', null, 'special', false];
        yield 'od special' => ['raw', '623KK', 'special', null, 'special', true];
        yield 'super' => ['raw', '236236P', 'super', null, 'special', false];
        yield 'throw' => ['raw', 'LPLK', 'throw', null, 'misc', false];
        yield 'drive impact' => ['raw', 'HPHK', 'drive', null, 'misc', false];
        yield 'no frame data falls back to the export category' => ['raw', '236PP', null, 'special_move', 'special', true];
        yield 'no frame data normal' => ['raw', '5MP', null, 'normal_command_or_contextual', 'medium', false];
    }
}
