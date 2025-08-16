<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\ComboSequences;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ComboSequences>
 */
class ComboSequencesRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ComboSequences::class);
    }

    public function findAllLeafs(): array
    {
        $qb = $this->createQueryBuilder('cs')
            ->innerJoin('cs.type', 'cst')
            ->addSelect('cst')
            ->where('cst.name = :typeName')
            ->setParameter('typeName', 'leaf')
            ->orderBy('cs.id', 'ASC');

        return $qb->getQuery()->getResult();
    }
}
