<?php declare(strict_types=1);

namespace App\Command;

use App\Service\FrameDataImportResult;
use App\Service\FrameDataUpsertService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'frame-data:import:fat-json',
    description: 'Import FAT JSON frame data into the database'
)]
class ImportFrameDataFromFatJsonCommand extends Command
{
    public function __construct(private readonly string $projectDir, private readonly FrameDataUpsertService $frameDataUpsertService)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('path', null, InputOption::VALUE_REQUIRED, 'Path to FAT JSON file. Defaults to backend data/fat_data.json.')
            ->addOption('label', null, InputOption::VALUE_REQUIRED, 'Human-readable import batch label. Defaults to FAT JSON plus source version.')
            ->addOption('source-version', null, InputOption::VALUE_REQUIRED, 'Patch/source version including day, for example 2026-08-29. Defaults to today.')
            ->addOption('source-reference', null, InputOption::VALUE_REQUIRED, 'Source reference for the imported file. Defaults to the file basename.')
            ->addOption('dry-run', null, InputOption::VALUE_NONE, 'Parse and report changes without flushing them.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $pathOption = $input->getOption('path');
        $path = is_string($pathOption) && '' !== trim($pathOption) ? trim($pathOption) : $this->projectDir . '/data/fat_data.json';
        if (!file_exists($path)) {
            $output->writeln("<error>JSON file not found at: $path</error>");
            return Command::FAILURE;
        }

        $json = file_get_contents($path);
        $data = json_decode($json, true);

        if (!$data || !is_array($data)) {
            $output->writeln("<error>Invalid JSON format.</error>");
            return Command::FAILURE;
        }

        $labelOption = $input->getOption('label');
        $sourceVersionOption = $input->getOption('source-version');
        $sourceReferenceOption = $input->getOption('source-reference');
        $result = $this->frameDataUpsertService->upsertFatData(
            $data,
            (bool) $input->getOption('dry-run'),
            is_string($sourceVersionOption) && '' !== trim($sourceVersionOption) ? trim($sourceVersionOption) : null,
            is_string($sourceReferenceOption) && '' !== trim($sourceReferenceOption) ? trim($sourceReferenceOption) : basename($path),
            hash_file('sha256', $path) ?: null,
            is_string($labelOption) && '' !== trim($labelOption) ? trim($labelOption) : null,
        );
        $this->writeResult($output, $result, (bool) $input->getOption('dry-run'));

        return Command::SUCCESS;
    }

    private function writeResult(OutputInterface $output, FrameDataImportResult $result, bool $dryRun): void
    {
        foreach ($result->warnings as $warning) {
            $output->writeln(sprintf('<comment>%s</comment>', $warning));
        }

        $prefix = $dryRun ? 'Dry run processed' : 'Imported';
        $output->writeln(sprintf('<info>%s %d moves into the database.</info>', $prefix, $result->processed));
        $output->writeln(sprintf('<info>Characters created: %d.</info>', $result->charactersCreated));
        $output->writeln(sprintf('<info>Moves created: %d.</info>', $result->movesCreated));
        $output->writeln(sprintf('<info>Frame data rows created: %d.</info>', $result->frameDataCreated));
        $output->writeln(sprintf('<info>Existing moves updated due to differences: %d.</info>', $result->frameDataUpdated));
        $output->writeln(sprintf('<info>Existing moves unchanged: %d.</info>', $result->unchanged));
        $output->writeln(sprintf('<info>Skipped records: %d.</info>', $result->skipped));
        if (!$dryRun && null !== $result->importBatch) {
            $output->writeln(sprintf('<info>Import batch: #%d %s (%s).</info>', $result->importBatch->getId(), $result->importBatch->getLabel(), $result->importBatch->getSourceVersion()));
            $output->writeln(sprintf('<info>Source checksum: %s.</info>', $result->importBatch->getSourceChecksum() ?? 'none'));
        }
    }
}
