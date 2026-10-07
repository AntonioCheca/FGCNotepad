<?php declare(strict_types=1);

namespace App\Command;

use App\Service\MoveCommonNameImportService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'frame-data:import:common-names',
    description: 'Copy FAT common move names (cmnName) onto existing moves without touching frame data'
)]
final class ImportMoveCommonNamesCommand extends Command
{
    public function __construct(private readonly string $projectDir, private readonly MoveCommonNameImportService $importService)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('path', null, InputOption::VALUE_REQUIRED, 'Path to FAT JSON file. Defaults to backend data/fat_data.json.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $pathOption = $input->getOption('path');
        $path = is_string($pathOption) && '' !== trim($pathOption) ? trim($pathOption) : $this->projectDir . '/data/fat_data.json';
        $data = is_file($path) ? json_decode((string) file_get_contents($path), true) : null;
        if (!is_array($data)) {
            $output->writeln(sprintf('<error>No valid FAT JSON at %s.</error>', $path));

            return Command::FAILURE;
        }

        $output->writeln(sprintf('Updated common names on %d moves.', $this->importService->import($data)));

        return Command::SUCCESS;
    }
}
