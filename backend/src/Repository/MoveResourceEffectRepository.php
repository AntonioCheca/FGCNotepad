<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\Move;
use App\Entity\MoveResourceEffect;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<MoveResourceEffect>
 */
class MoveResourceEffectRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MoveResourceEffect::class);
    }

    /**
     * @param list<Move> $moves
     *
     * @return array<string, list<MoveResourceEffect>> effects keyed by move id
     */
    public function findGroupedByMove(array $moves): array
    {
        if ([] === $moves) {
            return [];
        }

        $grouped = [];
        foreach ($this->createQueryBuilder('effect')
            ->addSelect('object')
            ->innerJoin('effect.characterObject', 'object')
            ->andWhere('effect.move IN (:moves)')
            ->setParameter('moves', $moves)
            ->getQuery()
            ->getResult() as $effect) {
            $grouped[(string) $effect->getMove()->getId()][] = $effect;
        }

        return $grouped;
    }
}
