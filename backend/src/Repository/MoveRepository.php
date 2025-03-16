<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\Move;
use App\Util\QueryHelper;
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

        $arrayOfItemsToQuery = explode(' ', $query);
        foreach ($arrayOfItemsToQuery as $itemToQuery) {
            $itemToQuery = '%' . $itemToQuery . '%';
            $quotedItem = QueryHelper::quoteStringForQuery($itemToQuery);
            $lowerItem = sprintf('LOWER(%s)', $quotedItem);
            $queryDraft->andWhere(sprintf('(LOWER(c.name) LIKE %1$s) OR (LOWER(m.numpadNotation) LIKE %1$s)', $lowerItem));
        }

        return $queryDraft->setMaxResults(10)
            ->getQuery()
            ->getResult();
    }
}
