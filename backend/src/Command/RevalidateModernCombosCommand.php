<?php declare(strict_types=1);

namespace App\Command;

use App\Service\Modern\ModernComboRevalidationService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: 'app:combo:revalidate-modern', description: 'Recompute stored Modern legality and per-mode damage of combos')]
class RevalidateModernCombosCommand extends Command
{
    public function __construct(private readonly ModernComboRevalidationService $revalidationService)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('character-id', null, InputOption::VALUE_REQUIRED, 'Only revalidate combos of this character.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $characterId = $input->getOption('character-id');
        $result = $this->revalidationService->revalidate(is_string($characterId) && '' !== trim($characterId) ? trim($characterId) : null);

        (new SymfonyStyle($input, $output))->success(sprintf('Checked %d combos; %d changed.', $result['checked'], $result['changed']));

        return Command::SUCCESS;
    }
}
