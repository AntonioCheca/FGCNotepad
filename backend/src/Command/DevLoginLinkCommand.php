<?php declare(strict_types=1);

namespace App\Command;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Util\Enum\UserRole;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\DependencyInjection\Attribute\When;
use Symfony\Component\Security\Http\LoginLink\LoginLinkHandlerInterface;

/**
 * Prints a one-time login URL for local tooling such as the mobile audit.
 * Registered only in dev and test, where the login_link authenticator exists.
 */
#[When(env: 'dev')]
#[When(env: 'test')]
#[AsCommand(name: 'app:dev:login-link', description: 'Print a one-time login link for a local user (dev/test only).')]
final class DevLoginLinkCommand extends Command
{
    public function __construct(
        #[Autowire(service: 'security.authenticator.login_link_handler.api')]
        private readonly LoginLinkHandlerInterface $loginLinkHandler,
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('username', InputArgument::REQUIRED, 'Local user to log in as.')
            ->addOption('create', null, InputOption::VALUE_NONE, 'Create the user if it does not exist (no usable password).')
            ->addOption('role', null, InputOption::VALUE_REQUIRED | InputOption::VALUE_IS_ARRAY, 'Roles to ensure on the user, e.g. --role=ROLE_ADMIN.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $username = (string) $input->getArgument('username');
        $user = $this->userRepository->findOneBy(['username' => $username]);

        if (!$user instanceof User) {
            if (!$input->getOption('create')) {
                $output->writeln(sprintf('<error>User "%s" does not exist. Pass --create to create it.</error>', $username));

                return Command::FAILURE;
            }

            $user = (new User())->setUsername($username);
            // A random hash nobody knows: this account can only log in through login links.
            $user->setPassword(password_hash(bin2hex(random_bytes(32)), PASSWORD_BCRYPT));
            $this->entityManager->persist($user);
        }

        $roles = $this->validRoles((array) $input->getOption('role'));
        if (null === $roles) {
            $output->writeln('<error>Unknown role. Use values from UserRole, e.g. ROLE_ADMIN.</error>');

            return Command::FAILURE;
        }
        if ([] !== $roles) {
            $user->setRoles(array_values(array_unique([...$user->getRoles(), ...$roles])));
        }
        $user->setIsActive(true);
        $this->entityManager->flush();

        $output->writeln($this->loginLinkHandler->createLoginLink($user)->getUrl());

        return Command::SUCCESS;
    }

    /**
     * @param list<mixed> $rawRoles
     *
     * @return list<string>|null
     */
    private function validRoles(array $rawRoles): ?array
    {
        $roles = [];
        foreach ($rawRoles as $rawRole) {
            $role = is_string($rawRole) ? UserRole::tryFrom($rawRole) : null;
            if (null === $role) {
                return null;
            }
            $roles[] = $role->value;
        }

        return $roles;
    }
}
