<?php declare(strict_types=1);

namespace App\Command;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\ScenarioTransfer\ScenarioImportService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:scenario:import', description: 'Import a scenario_export_v1 file (use --dry-run to only validate and preview)')]
final class ImportScenarioExportCommand extends Command
{
    public function __construct(
        private readonly ScenarioImportService $scenarioImportService,
        private readonly UserRepository $userRepository,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('file', InputArgument::REQUIRED, 'Path to the scenario_export_v1 JSON file.')
            ->addOption('dry-run', null, InputOption::VALUE_NONE, 'Validate and report without writing anything.')
            ->addOption('overwrite-site-edits', null, InputOption::VALUE_NONE, 'Replace scenarios that were edited on the site since their last import.')
            ->addOption('link-passes', null, InputOption::VALUE_REQUIRED, 'Fixed-point passes over linked scenarios (1-5, default 3).')
            ->addOption('author', null, InputOption::VALUE_REQUIRED, 'Username set as author of newly created scenarios.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $path = (string) $input->getArgument('file');
        $contents = is_file($path) ? file_get_contents($path) : false;
        $document = false === $contents ? null : json_decode($contents, true);
        if (!is_array($document)) {
            $output->writeln(sprintf('<error>%s is not a readable JSON file.</error>', $path));

            return Command::INVALID;
        }

        $author = null;
        $username = $input->getOption('author');
        if (is_string($username)) {
            $author = $this->userRepository->findOneBy(['username' => $username]);
            if (!$author instanceof User) {
                $output->writeln(sprintf('<error>User "%s" was not found.</error>', $username));

                return Command::INVALID;
            }
        }

        $overwrite = (bool) $input->getOption('overwrite-site-edits');
        $result = $input->getOption('dry-run')
            ? $this->scenarioImportService->dryRun($document, $overwrite)
            : $this->scenarioImportService->import($document, $author, $overwrite, is_numeric($input->getOption('link-passes')) ? (int) $input->getOption('link-passes') : null);

        $output->writeln((string) json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

        return ScenarioImportService::STATUS_OK === $result['status'] ? Command::SUCCESS : Command::FAILURE;
    }
}
