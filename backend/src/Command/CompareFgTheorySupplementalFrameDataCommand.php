<?php declare(strict_types=1);

namespace App\Command;

use App\Repository\FrameDataSupplementalValueRepository;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'frame-data:supplemental:compare', description: 'Compare active FGTheory supplemental values against base frame-data rows')]
final class CompareFgTheorySupplementalFrameDataCommand extends Command
{
    public function __construct(private readonly FrameDataSupplementalValueRepository $repository)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('batch', null, InputOption::VALUE_REQUIRED, 'Optional active supplemental batch id.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $batchOption = $input->getOption('batch');
        $batchId = is_string($batchOption) && '' !== trim($batchOption) ? (int) $batchOption : null;
        $rows = $this->repository->findActiveSupplementalValues($batchId);
        $differences = 0;

        foreach ($rows as $row) {
            $frameData = $row->getMove()->getFrameData();
            if (null === $frameData) {
                continue;
            }

            foreach ($row->toOverlayMap() as $columnName => $supplementalValue) {
                $baseValue = $frameData->getRawValue($columnName);
                if ($baseValue === $supplementalValue) {
                    continue;
                }

                ++$differences;
                $output->writeln(sprintf(
                    '<comment>%s %s %s: base=%s supplemental=%s</comment>',
                    $row->getMove()->getCharacter()->getName(),
                    $row->getMove()->getNumpadNotation(),
                    $columnName,
                    var_export($baseValue, true),
                    var_export($supplementalValue, true),
                ));
            }
        }

        $output->writeln(sprintf('<info>Compared %d supplemental rows. Differences: %d.</info>', count($rows), $differences));

        return Command::SUCCESS;
    }
}
