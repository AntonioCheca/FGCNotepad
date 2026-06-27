<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\StudyReviewLog;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<StudyReviewLog>
 */
final class StudyReviewLogRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, StudyReviewLog::class);
    }
}
