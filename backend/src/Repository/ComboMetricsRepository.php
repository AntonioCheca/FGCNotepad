<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\ComboMetrics;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ComboMetrics>
 */
class ComboMetricsRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ComboMetrics::class);
    }
}
