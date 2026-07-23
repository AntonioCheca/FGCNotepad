<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\RegistrationInviteCode;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<RegistrationInviteCode>
 */
class RegistrationInviteCodeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, RegistrationInviteCode::class);
    }

    public function findUnusedByCodeHash(string $codeHash): ?RegistrationInviteCode
    {
        return $this->findOneBy([
            'codeHash' => $codeHash,
            'isUsed' => false,
        ]);
    }
}
