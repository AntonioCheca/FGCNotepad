<?php declare(strict_types=1);

namespace App\Command;

use App\Entity\User;
use App\Service\ReportBundle\ReportBundleService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:report-bundle:import', description: 'Import a report_bundle_v1 file; everything it creates is approved by the given moderator')]
final class ImportReportBundleCommand extends Command
{
    public function __construct(
        private readonly ReportBundleService $reportBundleService,
        private readonly EntityManagerInterface $entityManager,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('file', InputArgument::REQUIRED, 'Path to the file, or - to read it from standard input.')
            ->addOption('moderator', null, InputOption::VALUE_REQUIRED, 'Username recorded as author and approver.')
            ->addOption('dry-run', null, InputOption::VALUE_NONE, 'Run the whole import, report it, and roll it back.')
            ->addOption('overwrite-site-edits', null, InputOption::VALUE_NONE, 'Replace scenarios edited on the site since their last import.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $moderator = $this->entityManager->getRepository(User::class)->findOneBy(['username' => (string) $input->getOption('moderator')]);
        if (!$moderator instanceof User || !array_intersect(['ROLE_MODERATOR', 'ROLE_ADMIN'], $moderator->getRoles())) {
            $output->writeln('<error>Pass --moderator with the username of a moderator or admin.</error>');

            return Command::INVALID;
        }

        $path = (string) $input->getArgument('file');
        $contents = '-' === $path ? stream_get_contents(STDIN) : (is_file($path) ? file_get_contents($path) : false);
        $document = is_string($contents) ? json_decode($contents, true) : null;
        if (!is_array($document)) {
            $output->writeln('<error>The file is missing or is not JSON.</error>');

            return Command::INVALID;
        }

        $result = $this->reportBundleService->import($document, $moderator, (bool) $input->getOption('dry-run'), (bool) $input->getOption('overwrite-site-edits'));
        $output->writeln(json_encode($result, \JSON_PRETTY_PRINT | \JSON_UNESCAPED_SLASHES | \JSON_UNESCAPED_UNICODE | \JSON_THROW_ON_ERROR));

        return ReportBundleService::STATUS_OK === $result['status'] ? Command::SUCCESS : Command::FAILURE;
    }
}
