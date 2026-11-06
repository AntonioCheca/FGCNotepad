<?php declare(strict_types=1);

namespace App\Command;

use App\Entity\Scenario;
use App\Service\ScenarioAliasService;
use App\Service\ScenarioResourceGridService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Uid\Uuid;

#[AsCommand(name: 'app:scenario:solve-resource-grids', description: 'Precompute and store the resource grid of every scenario, or of the given ones')]
final class SolveScenarioResourceGridsCommand extends Command
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
        $this->addOption('scenario', null, InputOption::VALUE_REQUIRED | InputOption::VALUE_IS_ARRAY, 'Scenario public id or alias; repeat for several');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $references = (array) $input->getOption('scenario');
        $scenarios = [] === $references
            ? $this->entityManager->getRepository(Scenario::class)->findBy([], ['id' => 'ASC'])
            : [];
        foreach ($references as $reference) {
            $scenario = $this->findScenario((string) $reference);
            if (null === $scenario) {
                $output->writeln(sprintf('<error>Scenario %s was not found.</error>', (string) $reference));

                return Command::INVALID;
            }
            $scenarios[] = $scenario;
        }

        $overall = hrtime(true);
        foreach ($scenarios as $scenario) {
            $start = hrtime(true);
            $grid = $this->resourceGridService->computeAndStore($scenario);
            $output->writeln(sprintf(
                '%s: %d solutions, %d runs, %.1f s',
                $scenario->getName(),
                $grid->getSolutions()->count(),
                $grid->getRuns()->count(),
                (hrtime(true) - $start) / 1e9,
            ));
        }
        $output->writeln(sprintf('Stored %d resource grids in %.1f s.', count($scenarios), (hrtime(true) - $overall) / 1e9));

        return Command::SUCCESS;
    }

    private function findScenario(string $reference): ?Scenario
    {
        if (Uuid::isValid($reference)) {
            return $this->entityManager->getRepository(Scenario::class)->findOneBy(['publicId' => Uuid::fromString($reference)]);
        }

        return $this->aliasService->findScenario($reference);
    }
}
