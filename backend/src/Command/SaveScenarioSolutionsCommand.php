<?php declare(strict_types=1);

namespace App\Command;

use App\Entity\Scenario;
use App\Service\ScenarioSavedSolutionService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:scenario:save-solutions', description: 'Recompute and store the saved layer solution of every scenario')]
final class SaveScenarioSolutionsCommand extends Command
{
    private const BATCH_SIZE = 25;

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly ScenarioSavedSolutionService $scenarioSavedSolutionService,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $ids = $this->entityManager->createQuery('SELECT scenario.id FROM ' . Scenario::class . ' scenario ORDER BY scenario.id ASC')
            ->getSingleColumnResult();

        foreach (array_chunk($ids, self::BATCH_SIZE) as $batch) {
            foreach ($batch as $id) {
                $scenario = $this->entityManager->find(Scenario::class, $id);
                if ($scenario instanceof Scenario) {
                    $this->scenarioSavedSolutionService->refresh($scenario);
                }
            }
            $this->entityManager->flush();
            $this->entityManager->clear();
        }

        $output->writeln(sprintf('Saved solutions for %d scenarios.', count($ids)));

        return Command::SUCCESS;
    }
}
