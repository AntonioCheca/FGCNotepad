<?php declare(strict_types=1);

namespace App\Command;

use App\Entity\Scenario;
use App\Repository\ScenarioRepository;
use App\Service\ScenarioTransfer\ScenarioExportService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Uid\Uuid;

#[AsCommand(name: 'app:scenario:export', description: 'Export scenarios as a scenario_export_v1 document')]
final class ExportScenariosCommand extends Command
{
    public function __construct(
        private readonly ScenarioRepository $scenarioRepository,
        private readonly ScenarioExportService $scenarioExportService,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('source', null, InputOption::VALUE_REQUIRED, 'Export every scenario imported from this source.')
            ->addOption('id', null, InputOption::VALUE_REQUIRED | InputOption::VALUE_IS_ARRAY, 'Scenario public id (repeatable).')
            ->addOption('output', 'o', InputOption::VALUE_REQUIRED, 'Write to this file instead of stdout.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $scenarios = [];
        $source = $input->getOption('source');
        if (is_string($source)) {
            $scenarios = $this->scenarioRepository->findByImportSource($source);
        }

        foreach ((array) $input->getOption('id') as $id) {
            $scenario = Uuid::isValid((string) $id) ? $this->scenarioRepository->findOneByPublicId((string) $id) : null;
            if (!$scenario instanceof Scenario) {
                $output->writeln(sprintf('<error>Scenario %s was not found.</error>', (string) $id));

                return Command::INVALID;
            }
            $scenarios[] = $scenario;
        }

        if ([] === $scenarios) {
            $output->writeln('<error>Nothing to export: pass --source or --id.</error>');

            return Command::INVALID;
        }

        $json = (string) json_encode($this->scenarioExportService->exportDocument($scenarios), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $file = $input->getOption('output');
        if (is_string($file)) {
            file_put_contents($file, $json . "\n");
            $output->writeln(sprintf('Exported %d scenarios to %s.', count($scenarios), $file));
        } else {
            $output->writeln($json);
        }

        return Command::SUCCESS;
    }
}
