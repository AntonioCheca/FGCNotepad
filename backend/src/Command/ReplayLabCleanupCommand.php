<?php declare(strict_types=1);

namespace App\Command;

use App\Service\ReplayLabCleanupService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:replay-lab:cleanup', description: 'Delete expired replay originals and orphan replay clips')]
final class ReplayLabCleanupCommand extends Command
{
    public function __construct(private readonly ReplayLabCleanupService $cleanupService)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('limit', null, InputOption::VALUE_REQUIRED, 'Maximum replays/clips to inspect per cleanup category', '100')
            ->addOption('dry-run', null, InputOption::VALUE_NONE, 'Report cleanup counts without changing storage or database rows');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $limit = (int) $input->getOption('limit');
        if ($limit <= 0) {
            $output->writeln('<error>--limit must be greater than 0.</error>');

            return Command::INVALID;
        }

        $result = $this->cleanupService->cleanup(limit: $limit, dryRun: (bool) $input->getOption('dry-run'));
        foreach ($result->toArray() as $key => $value) {
            $output->writeln(sprintf('%s: %d', $key, $value));
        }

        return Command::SUCCESS;
    }
}
