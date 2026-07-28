<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\FrameData;
use App\Entity\FrameDataOverride;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<FrameDataOverride>
 */
class FrameDataOverrideRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, FrameDataOverride::class);
    }

    /**
     * @param list<FrameData> $frameDataRows
     *
     * @return array<string, array<string, mixed>>
     */
    public function findOverrideMapForFrameDataRows(array $frameDataRows): array
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

        $rows = $this->createQueryBuilder('override')
            ->select('IDENTITY(override.frameData) AS frameDataId', 'override.columnName AS columnName', 'override.overrideValue AS overrideValue')
            ->where('override.frameData IN (:frameDataIds)')
            ->setParameter('frameDataIds', $ids)
            ->getQuery()
            ->getArrayResult();

        $map = [];
        foreach ($rows as $row) {
            $frameDataId = (string) $row['frameDataId'];
            $map[$frameDataId][(string) $row['columnName']] = $row['overrideValue'];
        }

        return $map;
    }
}
