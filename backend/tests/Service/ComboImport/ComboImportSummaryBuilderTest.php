<?php declare(strict_types=1);

namespace App\Tests\Service\ComboImport;

use App\Service\ComboImport\ComboImportSummaryBuilder;
use App\Service\ComboImport\Model\ImportParseResult;
use App\Service\ComboImport\Model\ImportedComboCandidate;
use App\Service\ComboImport\Model\ResolvedImportedComboCandidate;
use PHPUnit\Framework\TestCase;

final class ComboImportSummaryBuilderTest extends TestCase
{
    public function testBuildCountsValidPartialAndDiscardedCombos(): void
    {
        $builder = new ComboImportSummaryBuilder();

        $candidate = new ImportedComboCandidate(
            source: 'newchallenger',
            character: 'Akuma',
            sourceFile: 'akuma.tsv',
            lineNumber: 4,
            section: 'Meterless',
            comboTextRaw: 'st. lp, cr. lp xx srk+hp',
            damageRaw: '1570',
            driveRaw: '0',
            superRaw: '0',
            positionRaw: null,
            difficultyRaw: null,
            notesRaw: 'sample',
            videoRaw: null,
            warnings: [],
            rawRowSnapshot: ['a'],
        );

        $parse = new ImportParseResult(10, 3, 2, [$candidate], ['parser warning']);

        $resolved = [
            new ResolvedImportedComboCandidate($candidate, '5LP, 2LP, XX, 623HP', [['child_sequence_id' => 1, 'ordinal_in_combo' => 1, 'connection_type_id' => 1, 'connection_type_name' => 'Initial', 'token' => '5LP']], [], [], 'valid'),
            new ResolvedImportedComboCandidate($candidate, '5LP, UNKNOWN', [], ['warn'], [['index' => 2, 'token' => 'UNKNOWN', 'normalizedToken' => 'UNKNOWN', 'code' => 'unknown_move', 'message' => 'unknown']], 'partial'),
            new ResolvedImportedComboCandidate($candidate, null, [], [], [], 'discarded'),
        ];

        $report = $builder->build($parse, $resolved, 1);

        self::assertSame(1, $report->validCombos);
        self::assertSame(1, $report->partialCombos);
        self::assertSame(3, $report->discardedLines);
        self::assertSame(1, $report->persistedCombos);
        self::assertNotEmpty($report->previews);
    }
}
