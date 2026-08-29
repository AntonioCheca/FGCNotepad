<?php declare(strict_types=1);

namespace App\Command;

use App\Service\FgTheorySupplementalCsvImportService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'frame-data:import:fgtheory-csv', description: 'Import FGTheory supplemental frame data from an external CSV file')]
final class ImportFgTheorySupplementalCsvCommand extends Command
{
    public function __construct(private readonly FgTheorySupplementalCsvImportService $importService)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('path', null, InputOption::VALUE_REQUIRED, 'External CSV path to import.')
            ->addOption('label', null, InputOption::VALUE_REQUIRED, 'Human-readable import batch label.')
            ->addOption('source-version', null, InputOption::VALUE_REQUIRED, 'Patch/source version including day, for example 2026-08-29. Defaults to today.')
            ->addOption('dry-run', null, InputOption::VALUE_NONE, 'Parse and report without writing changes.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $path = $input->getOption('path');
        $label = $input->getOption('label');
        if (!is_string($path) || '' === trim($path) || !is_string($label) || '' === trim($label)) {
            $output->writeln('<error>Both --path and --label are required.</error>');
            return Command::FAILURE;
        }

        try {
            $sourceVersionOption = $input->getOption('source-version');
            $result = $this->importService->import(
                trim($path),
                trim($label),
                (bool) $input->getOption('dry-run'),
                is_string($sourceVersionOption) && '' !== trim($sourceVersionOption) ? trim($sourceVersionOption) : null,
            );
        } catch (\Throwable $exception) {
            $output->writeln(sprintf('<error>%s</error>', $exception->getMessage()));
            return Command::FAILURE;
        }

        foreach ($result->warnings as $warning) {
            $output->writeln(sprintf('<comment>%s</comment>', $warning));
        }

        $output->writeln(sprintf('<info>%s %d supplemental move rows.</info>', $input->getOption('dry-run') ? 'Dry run processed' : 'Imported', $result->processed));
        $output->writeln(sprintf('<info>Characters created: %d.</info>', $result->charactersCreated));
        $output->writeln(sprintf('<info>Moves created: %d.</info>', $result->movesCreated));
        $output->writeln(sprintf('<info>Frame data rows created: %d.</info>', $result->frameDataCreated));
        $output->writeln(sprintf('<info>Skipped records: %d.</info>', $result->skipped));
        if (!$input->getOption('dry-run') && null !== $result->importBatch) {
            $output->writeln(sprintf('<info>Import batch: #%d %s (%s).</info>', $result->importBatch->getId(), $result->importBatch->getLabel(), $result->importBatch->getSourceVersion()));
            $output->writeln(sprintf('<info>Source checksum: %s.</info>', $result->importBatch->getSourceChecksum() ?? 'none'));
        }

        return Command::SUCCESS;
    }
}
