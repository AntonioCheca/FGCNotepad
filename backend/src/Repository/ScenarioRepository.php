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
    public function searchByQuery(?string $query, int $limit = 50): array
    {
        $safeLimit = max(1, min($limit, 100));

        $qb = $this->createQueryBuilder('scenario')
            ->orderBy('scenario.updatedAt', 'DESC')
            ->setMaxResults($safeLimit);

        $normalizedQuery = null === $query ? '' : trim($query);
        if ('' !== $normalizedQuery) {
            $qb->andWhere('scenario.searchLabel LIKE :query')
                ->setParameter('query', '%' . mb_strtolower($normalizedQuery) . '%');
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

    //    /**
    //     * @return Scenario[] Returns an array of Scenario objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('s')
    //            ->andWhere('s.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('s.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?Scenario
    //    {
    //        return $this->createQueryBuilder('s')
    //            ->andWhere('s.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}
