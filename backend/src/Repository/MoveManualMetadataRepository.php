<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\Move;
use App\Entity\MoveManualMetadata;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<MoveManualMetadata>
 */
class MoveManualMetadataRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MoveManualMetadata::class);
    }

    /**
     * @param list<Move> $moves
     *
     * @return array<string, MoveManualMetadata>
     */
    public function findMapForMoves(array $moves): array
    {
        if ([] === $moves) {
            return [];
        }

        $metadataRows = $this->createQueryBuilder('metadata')
            ->innerJoin('metadata.move', 'move')
            ->addSelect('move')
            ->where('metadata.move IN (:moves)')
            ->setParameter('moves', $moves)
            ->getQuery()
            ->getResult();

        $map = [];
        foreach ($metadataRows as $metadata) {
            if (!$metadata instanceof MoveManualMetadata || null === $metadata->getMove()->getId()) {
                continue;
            }

            $map[$metadata->getMove()->getId()->toRfc4122()] = $metadata;
        }

        return $map;
    }
}
