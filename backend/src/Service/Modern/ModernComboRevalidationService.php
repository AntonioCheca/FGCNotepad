<?php declare(strict_types=1);

namespace App\Service\Modern;

use App\Entity\ComboSequences;
use App\Repository\ComboSequencesRepository;
use Doctrine\ORM\EntityManagerInterface;

/** Recomputes stored Modern legality and per-mode damage after the Modern game data they depend on changes. */
final class ModernComboRevalidationService
{
    private const BATCH_SIZE = 100;

    public function __construct(
        private readonly ComboSequencesRepository $comboSequencesRepository,
        private readonly ComboExecutionProfileService $executionProfileService,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /** @return array{checked:int,changed:int} */
    public function revalidate(?string $characterId = null): array
    {
        $checked = 0;
        $changed = 0;
        foreach (array_chunk($this->comboSequencesRepository->findNonLeafIds($characterId), self::BATCH_SIZE) as $ids) {
            foreach ($this->comboSequencesRepository->findBy(['id' => $ids]) as $sequence) {
                ++$checked;
                $changed += $this->revalidateOne($sequence) ? 1 : 0;
            }
            $this->entityManager->flush();
            $this->entityManager->clear();
        }

        return ['checked' => $checked, 'changed' => $changed];
    }

    private function revalidateOne(ComboSequences $sequence): bool
    {
        $before = $this->snapshot($sequence);
        $this->executionProfileService->apply($sequence);

        return $before !== $this->snapshot($sequence);
    }

    /** @return array{0:bool,1:int|null,2:int|null,3:int|null} */
    private function snapshot(ComboSequences $sequence): array
    {
        $metrics = $sequence->getComboMetrics();

        return [$sequence->isModernLegal(), $metrics?->getDamage(), $metrics?->getModernMaxDamage(), $metrics?->getModernSimpleDamage()];
    }
}
