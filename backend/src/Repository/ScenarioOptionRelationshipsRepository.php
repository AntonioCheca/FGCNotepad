<?php

namespace App\Repository;

use App\Entity\ScenarioOptionRelationships;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ScenarioOptionRelationships>
 */
class ScenarioOptionRelationshipsRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ScenarioOptionRelationships::class);
    }
}
