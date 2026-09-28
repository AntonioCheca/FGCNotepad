<?php declare(strict_types=1);

namespace App\Command;

use App\Service\NotationTranslationImportService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:notation-translation:import', description: 'Replace the replay notation translation rules from an external CSV, and/or report which combos of an export still fail to resolve')]
final class ImportNotationTranslationsCommand extends Command
{
    public function __construct(
        private readonly NotationTranslationImportService $importService,
        private readonly EntityManagerInterface $entityManager,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('path', null, InputOption::VALUE_REQUIRED, 'External CSV with the full rule set.')
            ->addOption('report', null, InputOption::VALUE_REQUIRED, 'Combo export (document or bundle) to resolve against the rules.')
            ->addOption('dry-run', null, InputOption::VALUE_NONE, 'Roll back instead of saving; with --report, reports against the CSV rules without keeping them.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $path = $input->getOption('path');
        $reportPath = $input->getOption('report');
        $path = is_string($path) && '' !== trim($path) ? trim($path) : null;
        $reportPath = is_string($reportPath) && '' !== trim($reportPath) ? trim($reportPath) : null;
        if (null === $path && null === $reportPath) {
            $output->writeln('<error>Pass --path, --report, or both.</error>');

            return Command::FAILURE;
        }
        $dryRun = (bool) $input->getOption('dry-run');

        $connection = $this->entityManager->getConnection();
        $connection->beginTransaction();
        try {
            if (null !== $path) {
                $count = $this->importService->replaceRules($path);
                $output->writeln(sprintf('<info>%s %d rules.</info>', $dryRun ? 'Dry run parsed' : 'Imported', $count));
            }
            if (null !== $reportPath) {
                $this->writeReport($output, $this->importService->report($reportPath));
            }
            $dryRun ? $connection->rollBack() : $connection->commit();
        } catch (\Throwable $exception) {
            $connection->rollBack();
            $output->writeln(sprintf('<error>%s</error>', $exception->getMessage()));

            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }

    /** @param array{checked: int, resolved: int, notReady: int, translatedSteps: int, failures: array<string, array<string, int>>} $report */
    private function writeReport(OutputInterface $output, array $report): void
    {
        $output->writeln(sprintf(
            '<info>Ready combos: %d resolved / %d checked (%d steps translated). Not ready to export: %d.</info>',
            $report['resolved'],
            $report['checked'],
            $report['translatedSteps'],
            $report['notReady'],
        ));
        foreach ($report['failures'] as $character => $messages) {
            $output->writeln(sprintf('<comment>%s</comment>', $character));
            foreach ($messages as $message => $count) {
                $output->writeln(sprintf('  %3d  %s', $count, $message));
            }
        }
    }
}
