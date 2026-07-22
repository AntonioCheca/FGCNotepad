<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\Move;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Move>
 */
class MoveRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Move::class);
    }

    /**
     * @return Move[]
     */
    public function queryForSpecificNumpadOrCharactersFromString(string $query): array
    {
        $queryDraft = $this->createQueryBuilder('m')
            ->innerJoin('m.character', 'c');

        $arrayOfItemsToQuery = array_values(array_filter(explode(' ', $query), static fn (string $item): bool => '' !== trim($item)));
        foreach ($arrayOfItemsToQuery as $index => $itemToQuery) {
            $parameterName = sprintf('term%d', $index);
            $queryDraft
                ->andWhere(sprintf('(LOWER(c.name) LIKE :%1$s) OR (LOWER(m.numpadNotation) LIKE :%1$s)', $parameterName))
                ->setParameter($parameterName, '%' . mb_strtolower($itemToQuery) . '%');
        }

        return $queryDraft
            ->orderBy('m.numpadNotation', 'ASC')
            ->setMaxResults(250)
            ->getQuery()
            ->getResult();
    }

    /**
     * @param list<string> $moveIds
     *
     * @return list<array{move_id:string,damage:int}>
     */
    public function findMoveDamagesByCharacterAndIds(string $characterId, array $moveIds): array
    {
        if ([] === $moveIds) {
            return [];
        }

        $rows = $this->createQueryBuilder('move')
            ->select('move.id AS move_id', 'frameData.damage AS damage')
            ->innerJoin('move.character', 'character')
            ->innerJoin('move.frameData', 'frameData')
            ->where('character.id = :characterId')
            ->andWhere('move.id IN (:moveIds)')
            ->andWhere('frameData.damage IS NOT NULL')
            ->setParameter('characterId', $characterId)
            ->setParameter('moveIds', $moveIds)
            ->orderBy('frameData.damage', 'DESC')
            ->addOrderBy('move.id', 'ASC')
            ->getQuery()
            ->getArrayResult();

        return array_map(
            static fn (array $row): array => [
                'move_id' => (string) $row['move_id'],
                'damage' => (int) $row['damage'],
            ],
            $rows
        );
    }
}
