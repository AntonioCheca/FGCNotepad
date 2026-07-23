<?php declare(strict_types=1);

namespace App\Command;

use App\Service\RegistrationInviteCodeService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: 'app:registration-invite:create', description: 'Create a one-time registration invite code')]
class CreateRegistrationInviteCodeCommand extends Command
{
    public function __construct(private readonly RegistrationInviteCodeService $inviteCodeService)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('label', null, InputOption::VALUE_REQUIRED, 'Optional label for tracking who the invite is for.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $label = $input->getOption('label');
        $result = $this->inviteCodeService->createInviteCode(is_string($label) ? $label : null);

        $io->success('Registration invite code created. Store it now; only its hash is saved.');
        $io->writeln($result['code']);

        return Command::SUCCESS;
    }
}
