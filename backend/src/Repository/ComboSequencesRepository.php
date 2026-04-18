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

    public function findAllNonLeafs(): array
    {
        $qb = $this->createQueryBuilder('cs')
            ->innerJoin('cs.type', 'cst')
            ->addSelect('cst')
            ->where('cst.name != :typeName')
            ->setParameter('typeName', 'leaf')
            ->orderBy('cs.id', 'ASC');

        return $qb->getQuery()->getResult();
    }

    /**
     * @return array<int, array{id: int, name: string, character_id: string, character_name: string}>
     */
    public function findLeafSummariesByCharacterId(string $characterId): array
    {
        $qb = $this->createQueryBuilder('cs')
            ->select('cs.id AS id', 'cs.name AS name', 'c.id AS character_id', 'c.name AS character_name')
            ->innerJoin('cs.type', 'cst')
            ->innerJoin('cs.move', 'm')
            ->innerJoin('m.character', 'c')
            ->where('cst.name = :typeName')
            ->andWhere('c.id = :characterId')
            ->setParameter('typeName', 'leaf')
            ->setParameter('characterId', $characterId)
            ->orderBy('cs.id', 'ASC');

        return $qb->getQuery()->getArrayResult();
    }

    /**
     * @return ComboSequences[]
     */
    public function findLeafsByCharacterId(string $characterId): array
    {
        $qb = $this->createQueryBuilder('cs')
            ->innerJoin('cs.type', 'cst')
            ->innerJoin('cs.move', 'm')
            ->innerJoin('m.character', 'c')
            ->leftJoin('m.frameData', 'fd')
            ->addSelect('cst', 'm', 'c', 'fd')
            ->where('cst.name = :typeName')
            ->andWhere('c.id = :characterId')
            ->setParameter('typeName', 'leaf')
            ->setParameter('characterId', $characterId)
            ->orderBy('cs.id', 'ASC');

        return $qb->getQuery()->getResult();
    }
}
