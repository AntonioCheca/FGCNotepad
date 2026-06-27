<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\ReplayReviewAccessToken;
use App\Entity\ReplayReviewSession;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ReplayReviewAccessToken>
 */
final class ReplayReviewAccessTokenRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ReplayReviewAccessToken::class);
    }

    /**
     * @return list<ReplayReviewAccessToken>
     */
    public function findForSession(ReplayReviewSession $session): array
    {
        return $this->createQueryBuilder('token')
            ->andWhere('token.session = :session')
            ->setParameter('session', $session)
            ->orderBy('token.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
