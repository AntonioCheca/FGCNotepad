<?php declare(strict_types=1);

namespace App\Tests\Service\ComboImport;

use App\Service\ComboImport\Model\ImportedRow;
use App\Service\ComboImport\Parser\NewChallengerImportParser;
use PHPUnit\Framework\TestCase;

final class NewChallengerImportParserTest extends TestCase
{
    public function testParseDetectsHeaderSectionsAndCandidates(): void
    {
        $parser = new NewChallengerImportParser();

        $rows = [
            new ImportedRow(1, 'Akuma Combo List', ['Akuma Combo List']),
            new ImportedRow(2, 'Combo\tDamage\tDrive\tSuper\tNotes', ['Combo', 'Damage', 'Drive', 'Super', 'Notes']),
            new ImportedRow(3, 'Meterless', ['Meterless']),
            new ImportedRow(4, 'st. lp, cr. lk, cr. lp xx srk+hp\t1570\t0\t0\t3 piece', ['st. lp, cr. lk, cr. lp xx srk+hp', '1570', '0', '0', '3 piece']),
            new ImportedRow(5, '', ['']),
            new ImportedRow(6, 'OD variants', ['OD variants']),
            new ImportedRow(7, 'cr. lp, cr. lp xx qcf+pp, qcb+hk\t2040\t2\t0\tCorner only', ['cr. lp, cr. lp xx qcf+pp, qcb+hk', '2040', '2', '0', 'Corner only']),
            new ImportedRow(8, 'non combo line', ['non combo line']),
        ];

        $result = $parser->parse($rows, 'Akuma', 'akuma.tsv');

        self::assertSame(8, $result->totalLines);
        self::assertSame(2, $result->candidateLineCount);
        self::assertCount(2, $result->candidates);
        self::assertSame('Meterless', $result->candidates[0]->section);
        self::assertSame(4, $result->candidates[0]->lineNumber);
        self::assertSame('st. lp, cr. lk, cr. lp xx srk+hp', $result->candidates[0]->comboTextRaw);
        self::assertSame('OD variants', $result->candidates[1]->section);
    }

    public function testParseHandlesMissingColumnsAndOnlySection(): void
    {
        $parser = new NewChallengerImportParser();

        $rows = [
            new ImportedRow(1, 'Combo\tDamage', ['Combo', 'Damage']),
            new ImportedRow(2, 'Meterless', ['Meterless']),
            new ImportedRow(3, 'cr. lp, cr. lp, cr. lp xx srk+hp\t1650', ['cr. lp, cr. lp, cr. lp xx srk+hp', '1650']),
            new ImportedRow(4, 'OD variants', ['OD variants']),
            new ImportedRow(5, 'cr. lp, cr. lp xx qcf+pp\t2000', ['cr. lp, cr. lp xx qcf+pp', '2000']),
        ];

        $result = $parser->parse($rows, 'Akuma', 'akuma.tsv', 'OD variants');

        self::assertCount(1, $result->candidates);
        self::assertSame('OD variants', $result->candidates[0]->section);
        self::assertSame('2000', $result->candidates[0]->damageRaw);
        self::assertNull($result->candidates[0]->driveRaw);
        self::assertNull($result->candidates[0]->superRaw);
    }
}
