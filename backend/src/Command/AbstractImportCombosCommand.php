<?php declare(strict_types=1);

namespace App\Command;

use App\Service\ComboImport\ComboImportContextProvider;
use App\Service\ComboImport\ComboImportPreviewFormatter;
use App\Service\ComboImport\ComboImportSummaryBuilder;
use App\Service\ComboImport\DelimitedImportFileReader;
use App\Service\ComboImport\ImportedComboCandidateResolver;
use App\Service\ComboImport\ImportedComboPersistenceService;
use App\Service\ComboImport\Parser\ComboImportParserInterface;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

abstract class AbstractImportCombosCommand extends Command
{
    public function __construct(
        private readonly string $projectDir,
        private readonly DelimitedImportFileReader $fileReader,
        private readonly ComboImportContextProvider $contextProvider,
        private readonly ImportedComboCandidateResolver $candidateResolver,
        private readonly ImportedComboPersistenceService $persistenceService,
        private readonly ComboImportSummaryBuilder $summaryBuilder,
        private readonly ComboImportPreviewFormatter $previewFormatter,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('character', InputArgument::REQUIRED, 'Character name, e.g. akuma')
            ->addOption('file', null, InputOption::VALUE_REQUIRED, 'Optional explicit TSV path')
            ->addOption('preview', null, InputOption::VALUE_NONE, 'Preview mode (default)')
            ->addOption('import', null, InputOption::VALUE_NONE, 'Persist valid combos')
            ->addOption('limit', null, InputOption::VALUE_REQUIRED, 'Limit preview items')
            ->addOption('only-section', null, InputOption::VALUE_REQUIRED, 'Only parse one section name');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $characterInput = trim((string) $input->getArgument('character'));
        $filePath = $this->resolveFilePath($characterInput, $input->getOption('file'));
        $limit = $this->parseLimit($input->getOption('limit'));
        $onlySection = $this->nullableTrim($input->getOption('only-section'));
        $importMode = (bool) $input->getOption('import');

        try {
            $rows = $this->fileReader->readTsv($filePath);
            $character = $this->contextProvider->resolveCharacter($characterInput);
            $leafOptions = $this->contextProvider->buildLeafOptions($character);
            $connectionTypes = $this->contextProvider->buildConnectionTypes();

            $parseResult = $this->getParser()->parse($rows, $character->getName(), $filePath, $onlySection);
            $resolved = $this->candidateResolver->resolve($parseResult->candidates, $leafOptions, $connectionTypes);

            $persisted = 0;
            if ($importMode) {
                $persisted = $this->persistenceService->persistValidCombos($resolved, $character);
            }

            $report = $this->summaryBuilder->build(
                parseResult: $parseResult,
                resolved: $resolved,
                persistedCombos: $persisted,
                limit: $limit,
            );

            $this->previewFormatter->format($report, $output);

            if (!$importMode) {
                $output->writeln('Mode: preview only (no persistence).');
            }

            return Command::SUCCESS;
        } catch (\Throwable $exception) {
            $output->writeln(sprintf('<error>%s</error>', $exception->getMessage()));

            return Command::FAILURE;
        }
    }

    abstract protected function getParser(): ComboImportParserInterface;

    abstract protected function getSourceFolderName(): string;

    private function resolveFilePath(string $characterInput, mixed $customPath): string
    {
        $custom = $this->nullableTrim($customPath);
        if (null !== $custom) {
            return $custom;
        }

        $characterFile = strtolower(trim($characterInput));
        $characterFile = preg_replace('/[^a-z0-9_-]+/', '', $characterFile) ?? $characterFile;

        return sprintf(
            '%s/data/combo_imports/%s/%s.tsv',
            $this->projectDir,
            $this->getSourceFolderName(),
            $characterFile,
        );
    }

    private function parseLimit(mixed $limitRaw): ?int
    {
        $value = $this->nullableTrim($limitRaw);
        if (null === $value) {
            return null;
        }

        if (!preg_match('/^\d+$/', $value)) {
            throw new \RuntimeException('Option --limit must be a positive integer.');
        }

        $limit = (int) $value;

        return $limit > 0 ? $limit : null;
    }

    private function nullableTrim(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        return '' === $trimmed ? null : $trimmed;
    }
}
