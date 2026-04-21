<?php declare(strict_types=1);

namespace App\Tests\Command;

use App\Command\ImportNewChallengerCombosCommand;
use App\Entity\Character;
use App\Service\ComboImport\ComboImportContextProvider;
use App\Service\ComboImport\ComboImportPreviewFormatter;
use App\Service\ComboImport\ComboImportSummaryBuilder;
use App\Service\ComboImport\DelimitedImportFileReader;
use App\Service\ComboImport\ImportedComboCandidateResolver;
use App\Service\ComboImport\ImportedComboPersistenceService;
use App\Service\ComboImport\Model\ImportExecutionReport;
use App\Service\ComboImport\Model\ImportedRow;
use App\Service\ComboImport\Parser\NewChallengerImportParser;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Tester\CommandTester;

final class ImportNewChallengerCombosCommandTest extends TestCase
{
    public function testPreviewModeDoesNotPersist(): void
    {
        $fileReader = $this->createMock(DelimitedImportFileReader::class);
        $contextProvider = $this->createMock(ComboImportContextProvider::class);
        $resolver = $this->createMock(ImportedComboCandidateResolver::class);
        $persistence = $this->createMock(ImportedComboPersistenceService::class);
        $summaryBuilder = $this->createMock(ComboImportSummaryBuilder::class);
        $formatter = $this->createMock(ComboImportPreviewFormatter::class);

        $rows = [
            new ImportedRow(1, 'Combo\tDamage', ['Combo', 'Damage']),
            new ImportedRow(2, 'st. lp, cr. lp xx srk+hp\t1570', ['st. lp, cr. lp xx srk+hp', '1570']),
        ];

        $fileReader->method('readTsv')->willReturn($rows);

        $character = (new Character())->setName('Akuma');
        $contextProvider->method('resolveCharacter')->willReturn($character);
        $contextProvider->method('buildLeafOptions')->willReturn([]);
        $contextProvider->method('buildConnectionTypes')->willReturn([]);
        $resolver->method('resolve')->willReturn([]);

        $persistence->expects(self::never())->method('persistValidCombos');

        $summaryBuilder->method('build')->willReturn(new ImportExecutionReport(2, 1, 0, 0, 1, 0, [], []));
        $formatter->expects(self::once())->method('format');

        $command = new ImportNewChallengerCombosCommand(
            projectDir: sys_get_temp_dir(),
            fileReader: $fileReader,
            contextProvider: $contextProvider,
            candidateResolver: $resolver,
            persistenceService: $persistence,
            summaryBuilder: $summaryBuilder,
            previewFormatter: $formatter,
            newChallengerImportParser: new NewChallengerImportParser(),
        );

        $tester = new CommandTester($command);
        $status = $tester->execute(['character' => 'akuma', '--preview' => true, '--file' => 'dummy.tsv']);

        self::assertSame(0, $status);
    }

    public function testImportModePersistsValidCombos(): void
    {
        $fileReader = $this->createMock(DelimitedImportFileReader::class);
        $contextProvider = $this->createMock(ComboImportContextProvider::class);
        $resolver = $this->createMock(ImportedComboCandidateResolver::class);
        $persistence = $this->createMock(ImportedComboPersistenceService::class);
        $summaryBuilder = $this->createMock(ComboImportSummaryBuilder::class);
        $formatter = $this->createMock(ComboImportPreviewFormatter::class);

        $rows = [
            new ImportedRow(1, 'Combo\tDamage', ['Combo', 'Damage']),
            new ImportedRow(2, 'st. lp, cr. lp xx srk+hp\t1570', ['st. lp, cr. lp xx srk+hp', '1570']),
        ];

        $fileReader->method('readTsv')->willReturn($rows);
        $character = (new Character())->setName('Akuma');

        $contextProvider->method('resolveCharacter')->willReturn($character);
        $contextProvider->method('buildLeafOptions')->willReturn([]);
        $contextProvider->method('buildConnectionTypes')->willReturn([]);
        $resolver->method('resolve')->willReturn([]);

        $persistence->expects(self::once())->method('persistValidCombos')->willReturn(2);
        $summaryBuilder->method('build')->willReturn(new ImportExecutionReport(2, 1, 1, 0, 0, 2, [], []));
        $formatter->expects(self::once())->method('format');

        $command = new ImportNewChallengerCombosCommand(
            projectDir: sys_get_temp_dir(),
            fileReader: $fileReader,
            contextProvider: $contextProvider,
            candidateResolver: $resolver,
            persistenceService: $persistence,
            summaryBuilder: $summaryBuilder,
            previewFormatter: $formatter,
            newChallengerImportParser: new NewChallengerImportParser(),
        );

        $tester = new CommandTester($command);
        $status = $tester->execute(['character' => 'akuma', '--import' => true, '--file' => 'dummy.tsv']);

        self::assertSame(0, $status);
    }
}
