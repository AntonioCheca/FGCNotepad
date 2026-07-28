<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\Situation;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<Situation> */
class SituationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Situation::class);
    }

    /** @return list<Situation> */
    public function findForList(?string $typeCode = null, bool $includeArchived = false): array
    {
        $qb = $this->createQueryBuilder('situation')
            ->innerJoin('situation.type', 'type')
            ->leftJoin('situation.opponentCharacter', 'opponentCharacter')
            ->leftJoin('situation.move', 'move')
            ->addSelect('type', 'opponentCharacter', 'move')
            ->orderBy('situation.name', 'ASC');

        if (!$includeArchived) {
            $qb->andWhere('situation.isArchived = false');
        }

        if (null !== $typeCode && '' !== trim($typeCode)) {
            $qb->andWhere('type.code = :typeCode')->setParameter('typeCode', $typeCode);
        }

        return $qb->getQuery()->getResult();
    }
}
