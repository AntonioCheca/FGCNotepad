<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\User;
use App\Entity\UserScenarioPreference;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<UserScenarioPreference>
 */
class UserScenarioPreferenceRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, UserScenarioPreference::class);
    }

    public function findOneByUser(User $user): ?UserScenarioPreference
    {
        return $this->createQueryBuilder('preference')
            ->andWhere('preference.user = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
