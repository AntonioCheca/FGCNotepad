<?php declare(strict_types=1);

namespace App\Command;

use App\Entity\Scenario;
use App\Entity\ScenarioResourceGrid;
use App\Service\ScenarioAliasService;
use App\Service\ScenarioResourceGridService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Uid\Uuid;

#[AsCommand(name: 'app:scenario:export-resource-grids', description: 'Export stored resource grids as a scenario_resource_grid_v1 document')]
final class ExportScenarioResourceGridsCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly ScenarioResourceGridService $resourceGridService,
        private readonly ScenarioAliasService $aliasService,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('scenario', null, InputOption::VALUE_REQUIRED | InputOption::VALUE_IS_ARRAY, 'Scenario public id or alias; repeat for several. Default: every grid of an aliased scenario.')
            ->addOption('output', 'o', InputOption::VALUE_REQUIRED, 'Write to this file instead of stdout.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $references = (array) $input->getOption('scenario');
        $grids = [];
        foreach ($references as $reference) {
            $scenario = Uuid::isValid((string) $reference)
                ? $this->entityManager->getRepository(Scenario::class)->findOneBy(['publicId' => Uuid::fromString((string) $reference)])
                : $this->aliasService->findScenario((string) $reference);
            $grid = null === $scenario ? null : $this->resourceGridService->findFor($scenario);
            if (null === $grid) {
                $output->writeln(sprintf('<error>No resource grid for scenario %s.</error>', (string) $reference));

                return Command::INVALID;
            }
            $grids[] = $grid;
        }

        if ([] === $references) {
            $grids = array_values(array_filter(
                $this->entityManager->getRepository(ScenarioResourceGrid::class)->findBy([], ['id' => 'ASC']),
                fn (ScenarioResourceGrid $grid): bool => null !== $this->aliasService->findAlias($grid->getScenario()),
            ));
        }

        if ([] === $grids) {
            $output->writeln('<error>Nothing to export: give scenarios an alias or pass --scenario.</error>');

            return Command::INVALID;
        }

        $json = (string) json_encode($this->resourceGridService->exportDocument($grids), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $file = $input->getOption('output');
        if (is_string($file)) {
            file_put_contents($file, $json . "\n");
            $output->writeln(sprintf('Exported %d resource grids to %s.', count($grids), $file));
        } else {
            $output->writeln($json);
        }

        return Command::SUCCESS;
    }
}
