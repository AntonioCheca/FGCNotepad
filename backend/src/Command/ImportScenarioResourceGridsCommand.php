<?php declare(strict_types=1);

namespace App\Command;

use App\Service\ScenarioResourceGridService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:scenario:import-resource-grids', description: 'Load resource grids from a scenario_resource_grid_v1 file, without solving anything')]
final class ImportScenarioResourceGridsCommand extends Command
{
    public function __construct(private readonly ScenarioResourceGridService $resourceGridService)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('file', InputArgument::REQUIRED, 'Path to the file, or - to read it from standard input.')
            ->addOption('dry-run', null, InputOption::VALUE_NONE, 'Check every grid without writing anything.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $path = (string) $input->getArgument('file');
        $contents = '-' === $path ? stream_get_contents(STDIN) : (is_file($path) ? file_get_contents($path) : false);
        $document = false === $contents ? null : json_decode($contents, true);
        if (!is_array($document)) {
            $output->writeln(sprintf('<error>%s is not a readable JSON file.</error>', $path));

            return Command::INVALID;
        }

        try {
            $report = $this->resourceGridService->importDocument($document, (bool) $input->getOption('dry-run'));
        } catch (\InvalidArgumentException $exception) {
            $output->writeln(sprintf('<error>%s</error>', $exception->getMessage()));

            return Command::INVALID;
        }

        foreach ($report['imported'] as $line) {
            $output->writeln(sprintf('%s %s', $input->getOption('dry-run') ? 'Would import' : 'Imported', $line));
        }
        foreach ($report['skipped'] as $line) {
            $output->writeln(sprintf('<comment>Skipped %s</comment>', $line));
        }

        return [] === $report['skipped'] ? Command::SUCCESS : Command::FAILURE;
    }
}
