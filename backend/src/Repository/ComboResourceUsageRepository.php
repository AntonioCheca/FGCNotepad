<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\ComboResourceUsage;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ComboResourceUsage>
 */
class ComboResourceUsageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ComboResourceUsage::class);
    }
}
