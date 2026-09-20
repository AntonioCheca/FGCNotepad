<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\Character;
use App\Util\ReplayMoveNotation;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Character>
 */
class CharacterRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Character::class);
    }

    /**
     * Returns only the id and name of all characters
     *
     * @return array<int, array{id: string, name: string}>
     */
    public function findAllIdsAndNames(): array
    {
        $conn = $this->getEntityManager()->getConnection();

        $sql = 'SELECT id, name FROM sf6.character ORDER BY name ASC';
        $stmt = $conn->executeQuery($sql);

        return $stmt->fetchAllAssociative();
    }

    /** Matches export names loosely ("E. Honda" finds "E.Honda"): case, spaces and punctuation are ignored. */
    public function findOneByExportName(string $name): ?Character
    {
        $exact = $this->findOneBy(['name' => $name]);
        if ($exact instanceof Character) {
            return $exact;
        }

        $wanted = ReplayMoveNotation::characterKey($name);
        if ('' === $wanted) {
            return null;
        }
        foreach ($this->findAll() as $character) {
            if (ReplayMoveNotation::characterKey($character->getName()) === $wanted) {
                return $character;
            }
        }

        return null;
    }
}
