<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\OkiProfile;
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
    public function searchByFilters(array $filters, int $limit = 100): array
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

        $query = isset($filters['q']) && is_string($filters['q']) ? trim(mb_strtolower($filters['q'])) : '';
        if ('' !== $query) {
            $qb->andWhere('LOWER(move.numpadNotation) LIKE :query OR LOWER(character.name) LIKE :query')
                ->setParameter('query', '%' . $query . '%');
        }

        foreach (['characterId' => 'character.id', 'moveId' => 'move.id'] as $key => $field) {
            $value = isset($filters[$key]) && is_string($filters[$key]) ? trim($filters[$key]) : '';
            if ('' !== $value) {
                $qb->andWhere(sprintf('%s = :%s', $field, $key))->setParameter($key, $value);
            }
        }

        foreach ([
            'usesDriveRush' => 'setup.usesDriveRush',
            'autoTimed' => 'setup.autoTimed',
            'cornerOnly' => 'setup.cornerOnly',
            'worksNoBackroll' => 'setup.worksNoBackroll',
            'worksBackroll' => 'setup.worksBackroll',
        ] as $key => $field) {
            if (array_key_exists($key, $filters) && is_bool($filters[$key])) {
                $qb->andWhere(sprintf('%s = :%s', $field, $key))->setParameter($key, $filters[$key]);
            }
        }

        if (($filters['hasFakeSetups'] ?? null) === true) {
            $qb->andWhere('setup.fakeNoBackroll = true OR setup.fakeBackroll = true');
        }

        $this->applyExistsNodeFilter($qb, $filters, 'optionType', 'optionNode.optionType');
        $this->applyExistsNodeFilter($qb, $filters, 'property', 'nodeProperty.property');

        return $qb->getQuery()->getResult();
    }

    public function findWithDetail(int $id): ?OkiProfile
    {
        return $this->createQueryBuilder('profile')
            ->innerJoin('profile.move', 'move')
            ->innerJoin('move.character', 'character')
            ->leftJoin('profile.setups', 'setup')
            ->leftJoin('setup.nodes', 'node')
            ->leftJoin('node.properties', 'property')
            ->leftJoin('node.interactions', 'interaction')
            ->leftJoin('interaction.defensiveMove', 'defensiveMove')
            ->leftJoin('defensiveMove.character', 'defensiveMoveCharacter')
            ->leftJoin('interaction.character', 'interactionCharacter')
            ->leftJoin('node.outgoingLinks', 'link')
            ->leftJoin('link.toNode', 'toNode')
            ->addSelect('move', 'character', 'setup', 'node', 'property', 'interaction', 'defensiveMove', 'defensiveMoveCharacter', 'interactionCharacter', 'link', 'toNode')
            ->andWhere('profile.id = :id')
            ->setParameter('id', $id)
            ->getQuery()
            ->getOneOrNullResult();
    }

    private function applyExistsNodeFilter(\Doctrine\ORM\QueryBuilder $qb, array $filters, string $key, string $field): void
    {
        $value = isset($filters[$key]) && is_string($filters[$key]) ? trim($filters[$key]) : '';
        if ('' === $value) {
            return;
        }

        if ('optionType' === $key) {
            $qb->innerJoin('setup.nodes', 'optionNode')->andWhere($field . ' = :optionType')->setParameter('optionType', $value);
            return;
        }

        $qb->innerJoin('setup.nodes', 'propertyNode')
            ->innerJoin('propertyNode.properties', 'nodeProperty')
            ->andWhere($field . ' = :property')
            ->setParameter('property', $value);
    }
}
