<?php declare(strict_types=1);

namespace App\Command;

use App\Entity\Scenario;
use App\Service\ScenarioLinkedComponentSolveService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:scenario:save-solutions', description: 'Recompute and store the saved layer solution and linked reference values of every scenario')]
final class SaveScenarioSolutionsCommand extends Command
{
    private const BATCH_SIZE = 25;

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly ScenarioLinkedComponentSolveService $linkedComponentSolveService,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $ids = $this->entityManager->createQuery('SELECT scenario.id FROM ' . Scenario::class . ' scenario ORDER BY scenario.id ASC')
            ->getSingleColumnResult();

        // Each linked component is solved once, as a whole; a scenario without links is a component of its own.
        $solved = [];
        $warnings = [];
        foreach (array_chunk($ids, self::BATCH_SIZE) as $batch) {
            foreach ($batch as $id) {
                $scenario = isset($solved[$id]) ? null : $this->entityManager->find(Scenario::class, $id);
                if (!$scenario instanceof Scenario) {
                    continue;
                }

                $component = $this->linkedComponentSolveService->findComponent([$scenario]);
                foreach ($component as $member) {
                    $solved[(int) $member->getId()] = true;
                }
                $report = $this->linkedComponentSolveService->solveAndStore($component);
                array_push($warnings, ...$report['warnings']);
            }
            $this->entityManager->flush();
            $this->entityManager->clear();
        }

        foreach ($warnings as $warning) {
            $output->writeln(sprintf('<comment>%s</comment>', $warning));
        }
        $output->writeln(sprintf('Saved solutions for %d scenarios.', count($ids)));

        return Command::SUCCESS;
    }
}
