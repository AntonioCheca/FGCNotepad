<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\ReplayVideo;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ReplayVideo>
 */
final class ReplayVideoRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ReplayVideo::class);
    }
}
