<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\RequirementSpecificCharacter;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<RequirementSpecificCharacter>
 */
class RequirementSpecificCharacterRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, RequirementSpecificCharacter::class);
    }
}
