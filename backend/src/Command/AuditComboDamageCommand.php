<?php declare(strict_types=1);

namespace App\Command;

use App\Repository\ComboSequencesRepository;
use App\Service\ComboDamageAuditService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: 'app:combo:audit-damage', description: 'Compare stored combo damage against the damage estimator')]
class AuditComboDamageCommand extends Command
{
    public function __construct(
        private readonly ComboDamageAuditService $comboDamageAuditService,
        private readonly ComboSequencesRepository $comboSequencesRepository,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('combo-ids', InputArgument::IS_ARRAY, 'Combo ids to audit; ranges such as 3418-3605 are accepted.')
            ->addOption('all', null, InputOption::VALUE_NONE, 'Audit every non-leaf combo.')
            ->addOption('json', null, InputOption::VALUE_NONE, 'Print the full report as JSON.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $comboIds = true === $input->getOption('all') ? $this->comboSequencesRepository->findNonLeafIds() : $this->parseComboIds((array) $input->getArgument('combo-ids'));
        if (null === $comboIds || [] === $comboIds) {
            $io->error('Give combo ids (for example 3418 3420-3430) or --all.');

            return Command::INVALID;
        }

        $report = $this->comboDamageAuditService->audit($comboIds);
        if (true === $input->getOption('json')) {
            $output->writeln(json_encode($report, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

            return Command::SUCCESS;
        }

        $rows = [];
        foreach ($report['results'] as $result) {
            if (ComboDamageAuditService::STATUS_MATCH !== $result['status']) {
                $rows[] = [$result['comboId'], $result['status'], $result['character'] ?? '', $result['starter'] ?? '', $result['storedDamage'] ?? '', $result['estimatedDamage'] ?? '', $result['difference'] ?? '', $result['notation'] ?? ''];
            }
        }
        if ([] !== $rows) {
            $io->table(['Combo', 'Status', 'Character', 'Starter', 'Stored', 'Estimated', 'Difference', 'Notation'], $rows);
        }
        $io->writeln(sprintf(
            'Checked %d combos: %d match, %d mismatch, %d unverifiable, %d not found.',
            $report['checkedCount'],
            $report['matchCount'],
            $report['mismatchCount'],
            $report['unverifiableCount'],
            $report['notFoundCount'],
        ));

        return Command::SUCCESS;
    }

    /**
     * @param array<mixed> $arguments
     *
     * @return list<int>|null null when an argument is neither an id nor a range
     */
    private function parseComboIds(array $arguments): ?array
    {
        $comboIds = [];
        foreach ($arguments as $argument) {
            if (!is_string($argument) || 1 !== preg_match('/^([1-9]\d*)(?:-([1-9]\d*))?$/', $argument, $matches)) {
                return null;
            }
            $first = (int) $matches[1];
            $last = isset($matches[2]) ? (int) $matches[2] : $first;
            if ($last < $first) {
                return null;
            }
            array_push($comboIds, ...range($first, $last));
        }

        return $comboIds;
    }
}
