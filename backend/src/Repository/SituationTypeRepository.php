<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\SituationType;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<SituationType> */
class SituationTypeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SituationType::class);
    }

    /** @return list<SituationType> */
    public function findAllOrdered(): array
    {
        return $this->createQueryBuilder('type')->orderBy('type.id', 'ASC')->getQuery()->getResult();
    }
}
