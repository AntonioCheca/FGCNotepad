<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Scenario;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Scenario>
 */
class ScenarioRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Scenario::class);
    }

    /**
     * @return list<Scenario>
     */
    public function searchByFilters(
        ?string $query,
        ?string $scenarioType,
        ?string $defenderCharacterId,
        ?string $attackerCharacterId,
        ?string $triggerMoveId,
        int $limit = 50
    ): array
    {
        $safeLimit = max(1, min($limit, 100));

        $qb = $this->createQueryBuilder('scenario')
            ->leftJoin('scenario.defenderCharacter', 'defender')
            ->leftJoin('scenario.attackerCharacter', 'attacker')
            ->leftJoin('scenario.triggerMove', 'triggerMove')
            ->andWhere('scenario.moderationState = :approvedState')
            ->setParameter('approvedState', 'approved')
            ->orderBy('scenario.updatedAt', 'DESC')
            ->setMaxResults($safeLimit);

        $normalizedQuery = null === $query ? '' : trim($query);
        if ('' !== $normalizedQuery) {
            $qb->andWhere('scenario.searchLabel LIKE :query')
                ->setParameter('query', '%' . mb_strtolower($normalizedQuery) . '%');
        }

        $normalizedScenarioType = null === $scenarioType ? '' : trim(mb_strtolower($scenarioType));
        if ('' !== $normalizedScenarioType) {
            $qb->andWhere('scenario.scenarioType = :scenarioType')
                ->setParameter('scenarioType', $normalizedScenarioType);
        }

        if (null !== $defenderCharacterId && '' !== trim($defenderCharacterId)) {
            $qb->andWhere('defender.id = :defenderCharacterId')
                ->setParameter('defenderCharacterId', trim($defenderCharacterId));
        }

        if (null !== $attackerCharacterId && '' !== trim($attackerCharacterId)) {
            $qb->andWhere('attacker.id = :attackerCharacterId')
                ->setParameter('attackerCharacterId', trim($attackerCharacterId));
        }

        if (null !== $triggerMoveId && '' !== trim($triggerMoveId)) {
            $qb->andWhere('triggerMove.id = :triggerMoveId')
                ->setParameter('triggerMoveId', trim($triggerMoveId));
        }

        return $qb->getQuery()->getResult();
    }

    public function findOneByPublicId(string $publicId): ?Scenario
    {
        return $this->createQueryBuilder('scenario')
            ->andWhere('scenario.publicId = :publicId')
            ->setParameter('publicId', $publicId)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function findOneApprovedByPublicId(string $publicId): ?Scenario
    {
        return $this->createQueryBuilder('scenario')
            ->andWhere('scenario.publicId = :publicId')
            ->andWhere('scenario.moderationState = :approvedState')
            ->setParameter('publicId', $publicId)
            ->setParameter('approvedState', 'approved')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * @return list<Scenario>
     */
    public function findEssentialByCharacterId(string $characterId): array
    {
        return $this->createQueryBuilder('scenario')
            ->leftJoin('scenario.attackerCharacter', 'attackerCharacter')
            ->leftJoin('scenario.defenderCharacter', 'defenderCharacter')
            ->leftJoin('scenario.rows', 'rows')
            ->leftJoin('scenario.columns', 'columns')
            ->leftJoin('scenario.cells', 'cells')
            ->leftJoin('cells.starterMoves', 'starterMoves')
            ->addSelect('attackerCharacter', 'defenderCharacter', 'rows', 'columns', 'cells', 'starterMoves')
            ->andWhere('scenario.isEssential = true')
            ->andWhere('scenario.moderationState = :approvedState')
            ->andWhere('attackerCharacter.id = :characterId OR defenderCharacter.id = :characterId')
            ->setParameter('approvedState', 'approved')
            ->setParameter('characterId', $characterId)
            ->orderBy('scenario.updatedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
