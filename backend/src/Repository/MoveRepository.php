<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\FrameData;
use App\Entity\FrameDataOverride;
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

    public function findWithEffectiveFrameData(mixed $id): ?Move
    {
        $move = $this->createQueryBuilder('move')
            ->leftJoin('move.character', 'character')
            ->addSelect('character')
            ->leftJoin('move.frameData', 'frameData')
            ->addSelect('frameData')
            ->where('move.id = :id')
            ->setParameter('id', $id)
            ->getQuery()
            ->getOneOrNullResult();

        if ($move instanceof Move) {
            $this->applyOverridesToMoves([$move]);
        }

        return $move instanceof Move ? $move : null;
    }

    /**
     * @return list<Move>
     */
    public function findByCharacterWithEffectiveFrameData(string $characterId): array
    {
        $moves = $this->createQueryBuilder('move')
            ->innerJoin('move.character', 'character')
            ->addSelect('character')
            ->leftJoin('move.frameData', 'frameData')
            ->addSelect('frameData')
            ->where('character.id = :characterId')
            ->setParameter('characterId', $characterId)
            ->orderBy('move.numpadNotation', 'ASC')
            ->getQuery()
            ->getResult();

        $this->applyOverridesToMoves($moves);

        return $moves;
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

        $moves = $queryDraft
            ->orderBy('m.numpadNotation', 'ASC')
            ->setMaxResults(250)
            ->getQuery()
            ->getResult();

        $this->applyOverridesToMoves($moves);

        return $moves;
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

        $moves = $this->createQueryBuilder('move')
            ->select('move', 'frameData')
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
            ->getResult();

        $this->applyOverridesToMoves($moves);

        usort($moves, static function (Move $first, Move $second): int {
            $firstDamage = $first->getFrameData()?->getDamage() ?? PHP_INT_MIN;
            $secondDamage = $second->getFrameData()?->getDamage() ?? PHP_INT_MIN;

            return $secondDamage <=> $firstDamage ?: strcmp((string) $first->getId(), (string) $second->getId());
        });

        return array_map(
            static fn (Move $move): array => [
                'move_id' => (string) $move->getId(),
                'damage' => (int) $move->getFrameData()?->getDamage(),
            ],
            $moves
        );
    }

    /**
     * @param list<Move> $moves
     */
    private function applyOverridesToMoves(array $moves): void
    {
        $frameDataRows = [];
        foreach ($moves as $move) {
            $frameData = $move->getFrameData();
            if ($frameData instanceof FrameData) {
                $frameDataRows[] = $frameData;
            }
        }

        if ([] === $frameDataRows) {
            return;
        }

        $overrideMap = $this->getEntityManager()
            ->getRepository(FrameDataOverride::class)
            ->findOverrideMapForFrameDataRows($frameDataRows);

        foreach ($frameDataRows as $frameData) {
            $frameDataId = $frameData->getId()?->toRfc4122();
            if (null !== $frameDataId) {
                $frameData->applyEffectiveOverrides($overrideMap[$frameDataId] ?? []);
            }
        }
    }
}
