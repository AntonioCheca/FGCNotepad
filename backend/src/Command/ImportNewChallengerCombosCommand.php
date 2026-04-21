<?php declare(strict_types=1);

namespace App\Command;

use App\Service\ComboImport\ComboImportContextProvider;
use App\Service\ComboImport\ComboImportPreviewFormatter;
use App\Service\ComboImport\ComboImportSummaryBuilder;
use App\Service\ComboImport\DelimitedImportFileReader;
use App\Service\ComboImport\ImportedComboCandidateResolver;
use App\Service\ComboImport\ImportedComboPersistenceService;
use App\Service\ComboImport\Parser\ComboImportParserInterface;
use App\Service\ComboImport\Parser\NewChallengerImportParser;
use Symfony\Component\Console\Attribute\AsCommand;

#[AsCommand(
    name: 'app:combo-import:newchallenger',
    description: 'Import combos from local New Challenger TSV files',
)]
final class ImportNewChallengerCombosCommand extends AbstractImportCombosCommand
{
    public function __construct(
        string $projectDir,
        DelimitedImportFileReader $fileReader,
        ComboImportContextProvider $contextProvider,
        ImportedComboCandidateResolver $candidateResolver,
        ImportedComboPersistenceService $persistenceService,
        ComboImportSummaryBuilder $summaryBuilder,
        ComboImportPreviewFormatter $previewFormatter,
        private readonly NewChallengerImportParser $newChallengerImportParser,
    ) {
        parent::__construct(
            $projectDir,
            $fileReader,
            $contextProvider,
            $candidateResolver,
            $persistenceService,
            $summaryBuilder,
            $previewFormatter,
        );
    }

    protected function getParser(): ComboImportParserInterface
    {
        return $this->newChallengerImportParser;
    }

    protected function getSourceFolderName(): string
    {
        return 'newchallenger';
    }
}
