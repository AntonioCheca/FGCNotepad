<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\BlockstringSequence;
use App\Entity\User;
use App\Util\Enum\ModerationState;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<BlockstringSequence> */
class BlockstringSequenceRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, BlockstringSequence::class);
    }

    /**
     * @param array<string, mixed> $filters
     * @return list<BlockstringSequence>
     */
    public function search(array $filters, int $limit = 100, ?User $visibleAuthor = null): array
    {
        $qb = $this->createQueryBuilder('sequence')
            ->leftJoin('sequence.attackerCharacter', 'attacker')
            ->leftJoin('sequence.steps', 'step')
            ->leftJoin('step.move', 'move')
            ->leftJoin('move.character', 'moveCharacter')
            ->leftJoin('sequence.defenseEntries', 'defenseEntry')
            ->leftJoin('defenseEntry.answers', 'answer')
            ->leftJoin('answer.defenderCharacter', 'defender')
            ->addSelect('attacker', 'step', 'move', 'moveCharacter', 'defenseEntry', 'answer', 'defender')
            ->distinct()
            ->setMaxResults(max(1, min($limit, 200)))
            ->orderBy('sequence.id', 'DESC');

        if ($visibleAuthor instanceof User) {
            $qb->andWhere('(sequence.moderationState = :approvedState OR sequence.author = :visibleAuthor)')
                ->setParameter('visibleAuthor', $visibleAuthor);
        } else {
            $qb->andWhere('sequence.moderationState = :approvedState');
        }
        $qb->setParameter('approvedState', ModerationState::APPROVED->value);

        $q = isset($filters['q']) && is_string($filters['q']) ? trim(mb_strtolower($filters['q'])) : '';
        if ('' !== $q) {
            $qb->andWhere('(LOWER(sequence.title) LIKE :q OR LOWER(sequence.summary) LIKE :q OR LOWER(move.numpadNotation) LIKE :q)')
                ->setParameter('q', '%' . $q . '%');
        }

        $attackerCharacterId = isset($filters['attackerCharacterId']) && is_string($filters['attackerCharacterId']) ? trim($filters['attackerCharacterId']) : '';
        if ('' !== $attackerCharacterId) {
            $qb->andWhere('attacker.id = :attackerCharacterId')
                ->setParameter('attackerCharacterId', $attackerCharacterId);
        }

        $defenderCharacterId = isset($filters['defenderCharacterId']) && is_string($filters['defenderCharacterId']) ? trim($filters['defenderCharacterId']) : '';
        if ('' !== $defenderCharacterId) {
            $qb->andWhere('(defender.id = :defenderCharacterId OR answer.defenderCharacter IS NULL)')
                ->setParameter('defenderCharacterId', $defenderCharacterId);
        }

        $moveId = isset($filters['moveId']) && is_string($filters['moveId']) ? trim($filters['moveId']) : '';
        if ('' !== $moveId) {
            $qb->andWhere('move.id = :moveId')
                ->setParameter('moveId', $moveId);
        }

        $classification = isset($filters['classification']) && is_string($filters['classification']) ? trim($filters['classification']) : '';
        if ('' !== $classification) {
            $qb->andWhere('sequence.classification = :classification')
                ->setParameter('classification', $classification);
        }

        return $qb->getQuery()->getResult();
    }

    public function findDetail(int $id, ?User $visibleAuthor = null): ?BlockstringSequence
    {
        $qb = $this->createQueryBuilder('sequence')
            ->leftJoin('sequence.author', 'author')
            ->leftJoin('sequence.attackerCharacter', 'attacker')
            ->leftJoin('sequence.steps', 'step')
            ->leftJoin('step.move', 'move')
            ->leftJoin('move.character', 'moveCharacter')
            ->leftJoin('sequence.offensePlans', 'offensePlan')
            ->leftJoin('sequence.defenseEntries', 'defenseEntry')
            ->leftJoin('defenseEntry.answers', 'answer')
            ->leftJoin('answer.defenderCharacter', 'defender')
            ->leftJoin('answer.move', 'answerMove')
            ->leftJoin('answerMove.character', 'answerMoveCharacter')
            ->leftJoin('sequence.conditions', 'condition')
            ->addSelect('author', 'attacker', 'step', 'move', 'moveCharacter', 'offensePlan', 'defenseEntry', 'answer', 'defender', 'answerMove', 'answerMoveCharacter', 'condition')
            ->andWhere('sequence.id = :id')
            ->setParameter('id', $id);

        if ($visibleAuthor instanceof User) {
            $qb->andWhere('(sequence.moderationState = :approvedState OR sequence.author = :visibleAuthor)')
                ->setParameter('visibleAuthor', $visibleAuthor);
        } else {
            $qb->andWhere('sequence.moderationState = :approvedState');
        }
        $qb->setParameter('approvedState', ModerationState::APPROVED->value);

        return $qb->getQuery()->getOneOrNullResult();
    }
}
