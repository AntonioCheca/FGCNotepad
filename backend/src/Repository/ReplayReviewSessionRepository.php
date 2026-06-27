<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\ReplayReviewSession;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ReplayReviewSession>
 */
final class ReplayReviewSessionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ReplayReviewSession::class);
    }
}
