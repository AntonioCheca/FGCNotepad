<?php declare(strict_types=1);

namespace App\Command;

use App\Service\ReportBundle\ReportBundleService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:report-bundle:build', description: 'Write a report_bundle_v1 file with a research report\'s combos, scenarios and resource grids')]
final class BuildReportBundleCommand extends Command
{
    public function __construct(private readonly ReportBundleService $reportBundleService)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('report', null, InputOption::VALUE_REQUIRED, 'The report\'s slug, for example juri-vs-ken-stats-across-ranks.')
            ->addOption('character', null, InputOption::VALUE_REQUIRED | InputOption::VALUE_IS_ARRAY, 'Include the approved combos this character starts; repeat for several.')
            ->addOption('scenario-source', null, InputOption::VALUE_REQUIRED, 'Include every scenario imported from this source, with its resource grid.', 'sf6replaysdb')
            ->addOption('output', 'o', InputOption::VALUE_REQUIRED, 'Write to this file instead of stdout.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $report = trim((string) $input->getOption('report'));
        $characters = array_values(array_filter(array_map('trim', (array) $input->getOption('character'))));
        if ('' === $report || [] === $characters) {
            $output->writeln('<error>Pass --report and at least one --character.</error>');

            return Command::INVALID;
        }

        $bundle = $this->reportBundleService->build($report, $characters, (string) $input->getOption('scenario-source'));
        $json = json_encode($bundle, \JSON_PRETTY_PRINT | \JSON_UNESCAPED_SLASHES | \JSON_UNESCAPED_UNICODE | \JSON_THROW_ON_ERROR) . "\n";
        $path = $input->getOption('output');
        if (is_string($path) && '' !== $path) {
            file_put_contents($path, $json);
            $output->writeln(sprintf(
                'Wrote %s: %d combos, %d scenarios, %d resource grids.',
                $path,
                count($bundle['combos']),
                count($bundle['scenarios']['scenarios'] ?? []),
                count($bundle['resourceGrids']['grids'] ?? []),
            ));
        } else {
            $output->write($json);
        }

        return Command::SUCCESS;
    }
}
