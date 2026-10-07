<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\OkiProfile;
use App\Entity\User;
use App\Util\Enum\ModerationState;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<OkiProfile> */
class OkiProfileRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, OkiProfile::class);
    }

    /**
     * @param array<string, mixed> $filters
     * @return list<OkiProfile>
     */
    public function searchByFilters(array $filters, int $limit = 100, ?User $viewer = null, bool $seeAllSetups = false): array
    {
        $safeLimit = max(1, min($limit, 300));
        $qb = $this->createQueryBuilder('profile')
            ->innerJoin('profile.move', 'move')
            ->innerJoin('move.character', 'character')
            ->leftJoin('profile.setups', 'setup')
            ->addSelect('move', 'character', 'setup')
            ->setMaxResults($safeLimit)
            ->distinct()
            ->orderBy('character.name', 'ASC')
            ->addOrderBy('move.numpadNotation', 'ASC');

        if (!$seeAllSetups) {
            $qb->andWhere('setup.id IS NULL OR setup.moderationState = :approvedState' . (null !== $viewer ? ' OR setup.author = :viewer' : ''))
                ->setParameter('approvedState', ModerationState::APPROVED->value);
            if (null !== $viewer) {
                $qb->setParameter('viewer', $viewer);
            }
        }

        foreach (['characterId' => 'character.id', 'moveId' => 'move.id'] as $key => $field) {
            $value = isset($filters[$key]) && is_string($filters[$key]) ? trim($filters[$key]) : '';
            if ('' !== $value) {
                $qb->andWhere(sprintf('%s = :%s', $field, $key))->setParameter($key, $value);
            }
        }

        return $qb->getQuery()->getResult();
    }

    public function findWithDetail(int $id): ?OkiProfile
    {
        return $this->createQueryBuilder('profile')
            ->innerJoin('profile.move', 'move')
            ->innerJoin('move.character', 'character')
            ->leftJoin('profile.setups', 'setup')
            ->leftJoin('setup.nodes', 'node')
            ->leftJoin('node.move', 'nodeMove')
            ->leftJoin('node.incomingLinks', 'link')
            ->addSelect('move', 'character', 'setup', 'node', 'nodeMove', 'link')
            ->andWhere('profile.id = :id')
            ->setParameter('id', $id)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
