<?php declare(strict_types=1);

namespace App\Command;

use App\Service\FrameDataVariantImportService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'frame-data:import:variants', description: 'Create variant moves (install sections, alternate damage values) from the FAT JSON, as listed in an external CSV')]
final class ImportFrameDataVariantsCommand extends Command
{
    private const DEFAULT_FAT_PATH = 'data/fat_data.json';

    public function __construct(
        private readonly FrameDataVariantImportService $importService,
        private readonly string $projectDir,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('path', null, InputOption::VALUE_REQUIRED, 'External CSV listing the variants (character,kind,source,target,note).')
            ->addOption('fat', null, InputOption::VALUE_REQUIRED, 'FAT JSON file.', self::DEFAULT_FAT_PATH)
            ->addOption('dry-run', null, InputOption::VALUE_NONE, 'Parse and report without writing changes.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $path = $input->getOption('path');
        if (!is_string($path) || '' === trim($path)) {
            $output->writeln('<error>--path is required.</error>');

            return Command::FAILURE;
        }
        $fatPath = (string) $input->getOption('fat');
        if (!str_starts_with($fatPath, '/')) {
            $fatPath = $this->projectDir . '/' . $fatPath;
        }
        $dryRun = (bool) $input->getOption('dry-run');

        try {
            $contents = @file_get_contents($fatPath);
            if (false === $contents) {
                throw new \InvalidArgumentException(sprintf('Cannot read FAT file "%s".', $fatPath));
            }
            $result = $this->importService->import(trim($path), json_decode($contents, true, 512, JSON_THROW_ON_ERROR), $dryRun);
        } catch (\Throwable $exception) {
            $output->writeln(sprintf('<error>%s</error>', $exception->getMessage()));

            return Command::FAILURE;
        }

        foreach ($result->warnings as $warning) {
            $output->writeln(sprintf('<comment>%s</comment>', $warning));
        }
        $output->writeln(sprintf('<info>%s %d variant moves: %d created, %d updated, %d unchanged.</info>', $dryRun ? 'Dry run processed' : 'Imported', $result->processed, $result->movesCreated, $result->frameDataUpdated, $result->unchanged));
        if (!$dryRun && $result->movesCreated > 0) {
            $output->writeln('<comment>Run app:generate-leafs so the new moves get leaf combos.</comment>');
        }

        return Command::SUCCESS;
    }
}
