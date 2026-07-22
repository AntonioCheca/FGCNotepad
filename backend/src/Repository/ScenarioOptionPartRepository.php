<?php

namespace App\Repository;

use App\Entity\ScenarioOptionPart;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ScenarioOptionPart>
 */
class ScenarioOptionPartRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ScenarioOptionPart::class);
    }
}
