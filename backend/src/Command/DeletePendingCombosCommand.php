<?php declare(strict_types=1);

namespace App\Command;

use App\Service\PendingComboDeletionService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:combos:delete-pending', description: 'Permanently delete every combo waiting in the moderation queue')]
final class DeletePendingCombosCommand extends Command
{
    private const SAMPLE_SIZE = 20;

    public function __construct(private readonly PendingComboDeletionService $deletionService)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('dry-run', null, InputOption::VALUE_NONE, 'Report what would be deleted without changing anything')
            ->addOption('force', null, InputOption::VALUE_NONE, 'Required to actually delete');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $dryRun = (bool) $input->getOption('dry-run');
        if (!$dryRun && !$input->getOption('force')) {
            $output->writeln('<error>Pass --dry-run to preview or --force to delete.</error>');

            return Command::INVALID;
        }

        $result = $this->deletionService->delete($dryRun);
        $output->writeln(sprintf('pending: %d', $result['pending']));
        $output->writeln(sprintf('deletable: %d', count($result['deletable'])));
        $skipped = $result['pending'] - count($result['deletable']);
        if ($skipped > 0) {
            $output->writeln(sprintf('<comment>skipped: %d (used as a step by another combo)</comment>', $skipped));
        }
        foreach (array_slice($result['deletable'], 0, self::SAMPLE_SIZE) as $combo) {
            $output->writeln(sprintf('  #%d %s', $combo['id'], $combo['name']));
        }
        if (count($result['deletable']) > self::SAMPLE_SIZE) {
            $output->writeln(sprintf('  ... and %d more', count($result['deletable']) - self::SAMPLE_SIZE));
        }
        $output->writeln(sprintf('deleted: %d', $result['deleted']));

        return Command::SUCCESS;
    }
}
