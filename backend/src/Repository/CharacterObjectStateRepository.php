<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\CharacterObjectState;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CharacterObjectState>
 */
class CharacterObjectStateRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CharacterObjectState::class);
    }
}
