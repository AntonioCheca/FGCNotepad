<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\CharacterObject;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CharacterObject>
 */
class CharacterObjectRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CharacterObject::class);
    }

    public function findOneByKey(string $objectKey): ?CharacterObject
    {
        return $this->findOneBy(['objectKey' => $objectKey]);
    }
}
