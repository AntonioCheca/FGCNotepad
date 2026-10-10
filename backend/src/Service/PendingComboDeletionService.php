<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ComboSequences;
use App\Entity\UserCombo;
use App\Repository\ComboSequencesRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Deletes every combo waiting in the moderation queue. Replay observations, flags and resource usage go with them
 * through database cascades; users' known-combo marks are removed explicitly because they do not cascade.
 */
final class PendingComboDeletionService
{
    private const BATCH_SIZE = 100;

    public function __construct(
        private readonly ComboSequencesRepository $comboSequencesRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * @return array{pending:int,deletable:list<array{id:int,name:string}>,deleted:int}
     */
    public function delete(bool $dryRun): array
    {
        $pending = $this->comboSequencesRepository->countPendingReview();
        $deletable = $this->comboSequencesRepository->findDeletablePendingReview();
        if ($dryRun || [] === $deletable) {
            return ['pending' => $pending, 'deletable' => $deletable, 'deleted' => 0];
        }

        $this->entityManager->wrapInTransaction(function () use ($deletable): void {
            foreach (array_chunk(array_column($deletable, 'id'), self::BATCH_SIZE) as $ids) {
                $this->deleteBatch($ids);
            }
        });

        return ['pending' => $pending, 'deletable' => $deletable, 'deleted' => count($deletable)];
    }

    /** @param list<int> $ids */
    private function deleteBatch(array $ids): void
    {
        $this->entityManager->createQueryBuilder()
            ->delete(UserCombo::class, 'uc')
            ->where('uc.combo IN (:ids)')
            ->setParameter('ids', $ids)
            ->getQuery()
            ->execute();

        foreach ($this->comboSequencesRepository->findBy(['id' => $ids]) as $combo) {
            $this->entityManager->remove($combo);
        }
        $this->entityManager->flush();
        $this->entityManager->clear();
    }
}
