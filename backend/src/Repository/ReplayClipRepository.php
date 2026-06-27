<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\ReplayClip;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ReplayClip>
 */
final class ReplayClipRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ReplayClip::class);
    }
}
