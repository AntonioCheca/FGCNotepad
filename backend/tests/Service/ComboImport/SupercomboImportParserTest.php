<?php declare(strict_types=1);

namespace App\Tests\Service\ComboImport;

use App\Service\ComboImport\Model\ImportedRow;
use App\Service\ComboImport\Parser\SupercomboImportParser;
use PHPUnit\Framework\TestCase;

final class SupercomboImportParserTest extends TestCase
{
    public function testParseDetectsHeaderAndMapsColumns(): void
    {
        $parser = new SupercomboImportParser();

        $rows = [
            new ImportedRow(1, 'Combo\tPosition\tDamage\tDrive Gauge\tSuper Gauge\tDifficulty\tNotes\tVideo', ['Combo', 'Position', 'Damage', 'Drive Gauge', 'Super Gauge', 'Difficulty', 'Notes', 'Video']),
            new ImportedRow(2, '2LP>2LP>2LP>623HP\tAnywhere\t1650\t-\t-\tEasy\tSimple light string confirm\thttps://video', ['2LP>2LP>2LP>623HP', 'Anywhere', '1650', '-', '-', 'Easy', 'Simple light string confirm', 'https://video']),
            new ImportedRow(3, 'PC DI 2HP>214HK\tAnywhere\t2800\t-\t-\tEasy\tGreat corner carry\t', ['PC DI 2HP>214HK', 'Anywhere', '2800', '-', '-', 'Easy', 'Great corner carry', '']),
        ];

        $result = $parser->parse($rows, 'Akuma', 'akuma.tsv');

        self::assertSame(2, $result->candidateLineCount);
        self::assertCount(2, $result->candidates);
        self::assertSame('Anywhere', $result->candidates[0]->positionRaw);
        self::assertNull($result->candidates[0]->driveRaw);
        self::assertNull($result->candidates[0]->superRaw);
        self::assertSame('Easy', $result->candidates[1]->difficultyRaw);
    }
}
