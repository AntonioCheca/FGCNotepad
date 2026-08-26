<?php declare(strict_types=1);

namespace App\Command;

use App\Entity\FrameDataImportBatch;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'frame-data:supplemental:retire', description: 'Retire an active FGTheory supplemental frame-data batch')]
final class RetireFgTheorySupplementalFrameDataCommand extends Command
{
    public function __construct(private readonly EntityManagerInterface $entityManager)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('batch', null, InputOption::VALUE_REQUIRED, 'Supplemental import batch id to retire.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $batchOption = $input->getOption('batch');
        if (!is_string($batchOption) || trim($batchOption) === '' || !ctype_digit(trim($batchOption))) {
            $output->writeln('<error>--batch is required and must be an integer id.</error>');
            return Command::FAILURE;
        }

        $batch = $this->entityManager->getRepository(FrameDataImportBatch::class)->find((int) $batchOption);
        if (!$batch instanceof FrameDataImportBatch || FrameDataImportBatch::SOURCE_SUPPLEMENTAL !== $batch->getSourceType()) {
            $output->writeln('<error>Supplemental batch not found.</error>');
            return Command::FAILURE;
        }

        $batch->retire();
        $this->entityManager->flush();
        $output->writeln(sprintf('<info>Retired supplemental batch %d (%s).</info>', $batch->getId(), $batch->getLabel()));

        return Command::SUCCESS;
    }
}
