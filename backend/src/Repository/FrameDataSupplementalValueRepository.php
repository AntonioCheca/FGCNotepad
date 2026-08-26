<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\FrameData;
use App\Entity\FrameDataImportBatch;
use App\Entity\FrameDataSupplementalValue;
use App\Entity\Move;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<FrameDataSupplementalValue>
 */
class FrameDataSupplementalValueRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, FrameDataSupplementalValue::class);
    }

    /**
     * @param list<FrameData> $frameDataRows
     *
     * @return array<string, array<string, mixed>>
     */
    public function findActiveOverlayMapForFrameDataRows(array $frameDataRows): array
    {
        $ids = [];
        foreach ($frameDataRows as $frameData) {
            if (null !== $frameData->getId()) {
                $ids[] = $frameData->getId()->toRfc4122();
            }
        }

        if ([] === $ids) {
            return [];
        }

        $rows = $this->createQueryBuilder('supplemental')
            ->innerJoin('supplemental.importBatch', 'batch')
            ->innerJoin('supplemental.move', 'move')
            ->innerJoin('move.frameData', 'frameData')
            ->addSelect('batch')
            ->where('batch.sourceType = :sourceType')
            ->andWhere('batch.active = true')
            ->andWhere('frameData.id IN (:frameDataIds)')
            ->setParameter('sourceType', FrameDataImportBatch::SOURCE_SUPPLEMENTAL)
            ->setParameter('frameDataIds', $ids)
            ->orderBy('batch.importedAt', 'ASC')
            ->getQuery()
            ->getResult();

        $map = [];
        foreach ($rows as $row) {
            if (!$row instanceof FrameDataSupplementalValue) {
                continue;
            }

            $frameDataId = $row->getMove()->getFrameData()?->getId()?->toRfc4122();
            if (null === $frameDataId) {
                continue;
            }

            $map[$frameDataId] = array_replace($map[$frameDataId] ?? [], $row->toOverlayMap());
        }

        return $map;
    }

    public function findOneByBatchAndMove(FrameDataImportBatch $batch, Move $move): ?FrameDataSupplementalValue
    {
        $value = $this->findOneBy(['importBatch' => $batch, 'move' => $move]);

        return $value instanceof FrameDataSupplementalValue ? $value : null;
    }

    /** @return list<FrameDataSupplementalValue> */
    public function findActiveSupplementalValues(?int $batchId = null): array
    {
        $qb = $this->createQueryBuilder('supplemental')
            ->innerJoin('supplemental.importBatch', 'batch')
            ->addSelect('batch')
            ->innerJoin('supplemental.move', 'move')
            ->addSelect('move')
            ->innerJoin('move.character', 'character')
            ->addSelect('character')
            ->leftJoin('move.frameData', 'frameData')
            ->addSelect('frameData')
            ->where('batch.sourceType = :sourceType')
            ->andWhere('batch.active = true')
            ->setParameter('sourceType', FrameDataImportBatch::SOURCE_SUPPLEMENTAL)
            ->orderBy('character.name', 'ASC')
            ->addOrderBy('move.numpadNotation', 'ASC');

        if (null !== $batchId) {
            $qb->andWhere('batch.id = :batchId')->setParameter('batchId', $batchId);
        }

        return $qb->getQuery()->getResult();
    }
}
