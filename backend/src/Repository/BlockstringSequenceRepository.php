<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\BlockstringSequence;
use App\Entity\User;
use App\Util\Enum\ModerationState;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
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
            ->innerJoin('sequence.attackerCharacter', 'attacker')
            ->innerJoin('sequence.startingMove', 'startingMove')
            ->leftJoin('startingMove.frameData', 'startingMoveFrameData')
            ->addSelect('attacker', 'startingMove', 'startingMoveFrameData')
            ->setMaxResults(max(1, min($limit, 200)))
            ->orderBy('attacker.name', 'ASC')
            ->addOrderBy('sequence.title', 'ASC');
        $this->restrictToVisible($qb, $visibleAuthor);

        $q = isset($filters['q']) && is_string($filters['q']) ? trim(mb_strtolower($filters['q'])) : '';
        if ('' !== $q) {
            $qb->andWhere('LOWER(sequence.title) LIKE :q')
                ->setParameter('q', '%' . $q . '%');
        }

        foreach (['attackerCharacterId' => 'attacker.id', 'startingMoveId' => 'startingMove.id'] as $key => $field) {
            $value = isset($filters[$key]) && is_string($filters[$key]) ? trim($filters[$key]) : '';
            if ('' !== $value) {
                $qb->andWhere(sprintf('%s = :%s', $field, $key))->setParameter($key, $value);
            }
        }

        return $qb->getQuery()->getResult();
    }

    public function findDetail(int $id, ?User $visibleAuthor = null): ?BlockstringSequence
    {
        $qb = $this->createQueryBuilder('sequence')
            ->leftJoin('sequence.author', 'author')
            ->leftJoin('sequence.attackerCharacter', 'attacker')
            ->leftJoin('sequence.startingMove', 'startingMove')
            ->leftJoin('sequence.blocks', 'block')
            ->leftJoin('sequence.steps', 'step')
            ->leftJoin('step.move', 'move')
            ->leftJoin('move.frameData', 'moveFrameData')
            ->leftJoin('move.character', 'moveCharacter')
            ->leftJoin('sequence.edges', 'edge')
            ->addSelect('author', 'attacker', 'startingMove', 'block', 'step', 'move', 'moveFrameData', 'moveCharacter', 'edge')
            ->andWhere('sequence.id = :id')
            ->setParameter('id', $id);
        $this->restrictToVisible($qb, $visibleAuthor);

        return $qb->getQuery()->getOneOrNullResult();
    }

    private function restrictToVisible(QueryBuilder $qb, ?User $visibleAuthor): void
    {
        if ($visibleAuthor instanceof User) {
            $qb->andWhere('(sequence.moderationState = :approvedState OR sequence.author = :visibleAuthor)')
                ->setParameter('visibleAuthor', $visibleAuthor);
        } else {
            $qb->andWhere('sequence.moderationState = :approvedState');
        }
        $qb->setParameter('approvedState', ModerationState::APPROVED->value);
    }
}
