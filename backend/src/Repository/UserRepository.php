<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\Connection;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\PasswordUpgraderInterface;

/**
 * @extends ServiceEntityRepository<User>
 */
class UserRepository extends ServiceEntityRepository implements PasswordUpgraderInterface
{
    private Connection $connection;

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
        $this->connection = $this->getEntityManager()->getConnection();
    }

    /**
     * Used to upgrade (rehash) the user's password automatically over time.
     */
    public function upgradePassword(PasswordAuthenticatedUserInterface $user, string $newHashedPassword): void
    {
        if (!$user instanceof User) {
            throw new UnsupportedUserException(sprintf('Instances of "%s" are not supported.', $user::class));
        }

        $user->setPassword($newHashedPassword);
        $this->getEntityManager()->persist($user);
        $this->getEntityManager()->flush();
    }

    /**
     * @return list<User>
     */
    public function findPaginated(int $page, int $size): array
    {
        $safePage = max(1, $page);
        $safeSize = max(1, min($size, 100));

        return $this->createQueryBuilder('u')
            ->orderBy('u.username', 'ASC')
            ->setFirstResult(($safePage - 1) * $safeSize)
            ->setMaxResults($safeSize)
            ->getQuery()
            ->getResult();
    }

    public function countAllUsers(): int
    {
        return (int) $this->createQueryBuilder('u')
            ->select('COUNT(u.id)')
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function countActiveAdmins(): int
    {
        $result = $this->connection->executeQuery(
            <<<SQL
                SELECT COUNT(*)
                FROM forum."user"
                WHERE is_active = TRUE
                  AND roles::text LIKE :adminRole
            SQL,
            ['adminRole' => '%ROLE_ADMIN%']
        )->fetchOne();

        return (int) $result;
    }
}
