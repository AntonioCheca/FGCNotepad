<?php declare(strict_types=1);

namespace App\Tests\Service\ComboImport;

use App\Service\ComboImport\ImportedComboCandidateResolver;
use App\Service\ComboImport\Model\ImportedComboCandidate;
use App\Service\ComboImport\SfNotationTranslator;
use App\Service\ComboNotationTranslator;
use PHPUnit\Framework\TestCase;

final class ImportedComboCandidateResolverTest extends TestCase
{
    public function testResolveMarksPartialWhenUnknownTokensRemain(): void
    {
        $resolver = new ImportedComboCandidateResolver(new ComboNotationTranslator(), new SfNotationTranslator());

        $candidate = new ImportedComboCandidate(
            source: 'newchallenger',
            character: 'Akuma',
            sourceFile: 'akuma.tsv',
            lineNumber: 10,
            section: 'Meterless',
            comboTextRaw: 'st. lp, weird_token, srk+hp',
            damageRaw: '1000',
            driveRaw: '0',
            superRaw: '0',
            positionRaw: null,
            difficultyRaw: null,
            notesRaw: null,
            videoRaw: null,
            warnings: [],
            rawRowSnapshot: [],
        );

        $leafOptions = [
            ['id' => 1, 'notation' => '5LP', 'moveType' => 'normal'],
            ['id' => 2, 'notation' => '623HP', 'moveType' => 'special'],
        ];
        $connectionTypes = [
            ['id' => 1, 'name' => 'Initial Move'],
            ['id' => 2, 'name' => 'Chain'],
            ['id' => 3, 'name' => 'Special'],
            ['id' => 6, 'name' => 'Link'],
        ];

        $resolved = $resolver->resolve([$candidate], $leafOptions, $connectionTypes);

        self::assertCount(1, $resolved);
        self::assertSame('partial', $resolved[0]->status);
        self::assertNotEmpty($resolved[0]->warnings);
    }
}
