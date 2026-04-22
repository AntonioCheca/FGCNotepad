<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Character;
use App\Entity\ComboSequences;
use App\Entity\User;
use App\Entity\UserCombo;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<UserCombo>
 */
class UserComboRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, UserCombo::class);
    }

    /**
     * @return list<int>
     */
    public function findKnownComboIdsByUserAndCharacterId(Uuid $userId, string $characterId): array
    {
        $rows = $this->createQueryBuilder('userCombo')
            ->select('combo.id AS combo_id')
            ->innerJoin('userCombo.combo', 'combo')
            ->innerJoin('userCombo.user', 'user')
            ->innerJoin('userCombo.character', 'character')
            ->andWhere('user.id = :userId')
            ->andWhere('character.id = :characterId')
            ->andWhere('userCombo.known = true')
            ->setParameter('userId', $userId)
            ->setParameter('characterId', $characterId)
            ->getQuery()
            ->getArrayResult();

        return array_values(array_map(static fn (array $row): int => (int) $row['combo_id'], $rows));
    }

    /**
     * @return list<UserCombo>
     */
    public function findByUserAndCharacter(User $user, Character $character): array
    {
        return $this->createQueryBuilder('userCombo')
            ->andWhere('userCombo.user = :user')
            ->andWhere('userCombo.character = :character')
            ->setParameter('user', $user)
            ->setParameter('character', $character)
            ->getQuery()
            ->getResult();
    }

    public function findOneByUserCharacterAndCombo(User $user, Character $character, ComboSequences $combo): ?UserCombo
    {
        return $this->createQueryBuilder('userCombo')
            ->andWhere('userCombo.user = :user')
            ->andWhere('userCombo.character = :character')
            ->andWhere('userCombo.combo = :combo')
            ->setParameter('user', $user)
            ->setParameter('character', $character)
            ->setParameter('combo', $combo)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
