<?php declare(strict_types=1);

namespace App\Repository;

use App\Entity\FrameDataImportBatch;
use App\Entity\NeutralObservation;
use App\Entity\NeutralObservationResource;
use App\Service\NeutralGaugeFilter;
use App\Service\NeutralRankLadder;
use App\Service\NeutralResourceCondition;
use App\Service\NeutralStatsFilterParser;
use App\Service\NeutralStatsFilters;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\ArrayParameterType;
use Doctrine\Persistence\ManagerRegistry;

/**
 * Filtered neutral observation aggregates. Eligibility for the stats page is fixed: Ranked replays and actors not
 * confirmed as Modern players (an unreported control scheme counts as Classic).
 *
 * @extends ServiceEntityRepository<NeutralObservation>
 */
class NeutralObservationRepository extends ServiceEntityRepository
{
    public const RANKED_GAME_MODE = 'RANKED_MATCH';
    public const MODERN_CONTROL_SCHEME = 'modern';

    public function __construct(ManagerRegistry $registry, private readonly NeutralRankLadder $rankLadder)
    {
        parent::__construct($registry, NeutralObservation::class);
    }

    /**
     * @param list<NeutralResourceCondition> $resourceConditions
     *
     * @return list<array{moveId: string, route: string, bucket: int, count: int, catalogueCategory: string|null}>
     */
    public function countByMoveRouteAndBucket(NeutralStatsFilters $filters, array $resourceConditions, ?int $battleVersion): array
    {
        [$where, $params, $types] = $this->where($filters, $resourceConditions, $battleVersion);
        $params['bucketSize'] = $filters->bucketSize;

        $rows = $this->getEntityManager()->getConnection()->fetchAllAssociative(
            sprintf(
                'SELECT o.move_id, o.route, FLOOR(o.spacing::numeric / CAST(:bucketSize AS numeric))::int AS bucket, COUNT(*) AS count, MAX(o.catalogue_category) AS catalogue_category
                 FROM sf6.neutral_observation o %s WHERE %s
                 GROUP BY o.move_id, o.route, bucket',
                $this->joins(),
                $where,
            ),
            $params,
            $types,
        );

        return array_map(static fn (array $row): array => [
            'moveId' => (string) $row['move_id'],
            'route' => (string) $row['route'],
            'bucket' => (int) $row['bucket'],
            'count' => (int) $row['count'],
            'catalogueCategory' => null === $row['catalogue_category'] ? null : (string) $row['catalogue_category'],
        ], $rows);
    }

    /** @param list<NeutralResourceCondition> $resourceConditions */
    public function countReplays(NeutralStatsFilters $filters, array $resourceConditions, ?int $battleVersion): int
    {
        [$where, $params, $types] = $this->where($filters, $resourceConditions, $battleVersion);

        return (int) $this->getEntityManager()->getConnection()->fetchOne(
            sprintf('SELECT COUNT(DISTINCT o.replay_id) FROM sf6.neutral_observation o %s WHERE %s', $this->joins(), $where),
            $params,
            $types,
        );
    }

    /** Largest spacing ever imported for the character, independent of every other filter. */
    public function maxSpacingForCharacter(string $characterId): ?float
    {
        $value = $this->getEntityManager()->getConnection()->fetchOne(
            'SELECT MAX(spacing) FROM sf6.neutral_observation WHERE character_id = :characterId',
            ['characterId' => $characterId],
        );

        return null === $value || false === $value ? null : (float) $value;
    }

    /** Move names, types and ranges come from frame data, so its imports also invalidate cached stats. */
    public function latestFrameDataImportId(): int
    {
        return (int) $this->getEntityManager()->getConnection()->fetchOne('SELECT COALESCE(MAX(id), 0) FROM sf6.frame_data_import_batch');
    }

    public function latestBattleVersion(): ?int
    {
        $value = $this->getEntityManager()->getConnection()->fetchOne(
            'SELECT MAX(r.battle_version) FROM sf6.replay r WHERE EXISTS (SELECT 1 FROM sf6.neutral_observation o WHERE o.replay_id = r.id)',
        );

        return null === $value || false === $value ? null : (int) $value;
    }

    /**
     * Moves added through the supplemental CSV (characters FAT does not cover yet) carry their name on the latest
     * supplemental row instead of on frame data. Max range follows the frame data overlay: the latest active
     * supplemental value wins over FAT's.
     *
     * @param list<string> $moveIds
     *
     * @return array<string, array{notation: string, name: string|null, moveType: string|null, maxRange: float|null}>
     */
    public function moveDetails(array $moveIds): array
    {
        if ([] === $moveIds) {
            return [];
        }

        $rows = $this->getEntityManager()->getConnection()->fetchAllAssociative(
            'SELECT m.id, m.numpad_notation, fd.move_type, COALESCE((
                SELECT sv.spacing FROM sf6.frame_data_supplemental_value sv
                JOIN sf6.frame_data_import_batch b ON b.id = sv.import_batch_id
                WHERE sv.move_id = m.id AND sv.spacing IS NOT NULL AND b.is_active = TRUE AND b.source_type = :supplemental
                ORDER BY b.imported_at DESC LIMIT 1
             ), fd.spacing) AS max_range, COALESCE(NULLIF(fd.move_name, \'\'), (
                SELECT sv.move_name FROM sf6.frame_data_supplemental_value sv
                WHERE sv.move_id = m.id AND sv.move_name IS NOT NULL AND sv.move_name <> \'\'
                ORDER BY sv.import_batch_id DESC LIMIT 1
             )) AS move_name
             FROM sf6.move m LEFT JOIN sf6.frame_data fd ON fd.id = m.frame_data_id WHERE m.id IN (:ids)',
            ['ids' => $moveIds, 'supplemental' => FrameDataImportBatch::SOURCE_SUPPLEMENTAL],
            ['ids' => ArrayParameterType::STRING],
        );

        $details = [];
        foreach ($rows as $row) {
            $details[(string) $row['id']] = [
                'notation' => (string) $row['numpad_notation'],
                'name' => null === $row['move_name'] || '' === $row['move_name'] ? null : (string) $row['move_name'],
                'moveType' => null === $row['move_type'] || '' === $row['move_type'] ? null : (string) $row['move_type'],
                'maxRange' => null === $row['max_range'] ? null : (float) $row['max_range'],
            ];
        }

        return $details;
    }

    /** Highest value observed for a character's resource, for resources without a declared maximum. */
    public function maxResourceValue(string $characterId, string $sourceKey): ?int
    {
        $value = $this->getEntityManager()->getConnection()->fetchOne(
            'SELECT MAX(r.value) FROM sf6.neutral_observation_resource r
             JOIN sf6.neutral_observation o ON o.id = r.observation_id
             WHERE r.source_key = :sourceKey AND (
                (r.side = :actor AND o.character_id = :characterId) OR (r.side = :opponent AND o.opponent_character_id = :characterId)
             )',
            [
                'sourceKey' => $sourceKey,
                'characterId' => $characterId,
                'actor' => NeutralObservationResource::SIDE_ACTOR,
                'opponent' => NeutralObservationResource::SIDE_OPPONENT,
            ],
        );

        return null === $value || false === $value ? null : (int) $value;
    }

    private function joins(): string
    {
        return 'JOIN sf6.replay r ON r.id = o.replay_id
                JOIN sf6.replay_player ap ON ap.id = o.actor_player_id
                JOIN sf6.replay_player op ON op.id = o.opponent_player_id';
    }

    /**
     * @param list<NeutralResourceCondition> $resourceConditions
     *
     * @return array{0: string, 1: array<string, mixed>, 2: array<string, int>}
     */
    private function where(NeutralStatsFilters $filters, array $resourceConditions, ?int $battleVersion): array
    {
        $conditions = [
            'o.character_id = :characterId',
            'r.game_mode = :rankedMode',
            'ap.control_scheme IS DISTINCT FROM :modern',
        ];
        $params = [
            'characterId' => $filters->characterId,
            'rankedMode' => self::RANKED_GAME_MODE,
            'modern' => self::MODERN_CONTROL_SCHEME,
        ];
        $types = [];

        if (null !== $filters->opponentId) {
            $conditions[] = 'o.opponent_character_id = :opponentId';
            $params['opponentId'] = $filters->opponentId;
        }
        if ([] !== $filters->regions) {
            $conditions[] = 'ap.region IN (:regions)';
            $params['regions'] = $filters->regions;
            $types['regions'] = ArrayParameterType::STRING;
        }

        $rank = $this->rankLadder->condition('ap', $filters->rankMin, $filters->rankMax, 'rank');
        $conditions[] = $rank['sql'];
        $params += $rank['params'];

        if ([] !== $filters->relativeMr) {
            $conditions[] = $this->relativeMrCondition($filters->relativeMr);
        }
        if (NeutralStatsFilters::PATCH_LATEST === $filters->patch) {
            $conditions[] = null === $battleVersion ? 'FALSE' : 'r.battle_version = :battleVersion';
            $params['battleVersion'] = $battleVersion;
        }

        $this->addGaugeConditions('actor', $filters->actorGauges, $conditions, $params);
        if (null !== $filters->opponentId) {
            $this->addGaugeConditions('opponent', $filters->opponentGauges, $conditions, $params);
        }

        foreach (array_values($resourceConditions) as $index => $resource) {
            $this->addResourceCondition($resource, $index, $conditions, $params, $types);
        }

        return [implode(' AND ', $conditions), array_filter($params, static fn (mixed $value): bool => null !== $value), $types];
    }

    /** @param list<string> $buckets */
    private function relativeMrCondition(array $buckets): string
    {
        $difference = '(op.master_rating - ap.master_rating)';
        $ranges = [];
        foreach ($buckets as $bucket) {
            [, $low, $high] = NeutralStatsFilterParser::RELATIVE_MR_BUCKETS[$bucket];
            $ranges[] = match (true) {
                null === $low => sprintf('%s <= %d', $difference, $high),
                null === $high => sprintf('%s >= %d', $difference, $low),
                default => sprintf('%s BETWEEN %d AND %d', $difference, $low, $high),
            };
        }

        return sprintf('(ap.is_master IS TRUE AND op.is_master IS TRUE AND (%s))', implode(' OR ', $ranges));
    }

    /**
     * @param list<string> $conditions
     * @param array<string, mixed> $params
     */
    private function addGaugeConditions(string $side, NeutralGaugeFilter $gauges, array &$conditions, array &$params): void
    {
        $bounds = [
            ['drive', '>=', null === $gauges->driveMin ? null : (int) round($gauges->driveMin * NeutralGaugeFilter::DRIVE_UNITS_PER_BAR)],
            ['drive', '<=', null === $gauges->driveMax ? null : (int) round($gauges->driveMax * NeutralGaugeFilter::DRIVE_UNITS_PER_BAR)],
            ['super', '>=', null === $gauges->superMin ? null : (int) round($gauges->superMin * NeutralGaugeFilter::SUPER_UNITS_PER_BAR)],
            ['super', '<=', null === $gauges->superMax ? null : (int) round($gauges->superMax * NeutralGaugeFilter::SUPER_UNITS_PER_BAR)],
            ['health', '>=', $gauges->healthMin],
            ['health', '<=', $gauges->healthMax],
        ];

        foreach ($bounds as $index => [$gauge, $operator, $value]) {
            if (null === $value) {
                continue;
            }
            $param = sprintf('%sGauge%d', $side, $index);
            $conditions[] = sprintf('o.%s_%s %s :%s', $side, $gauge, $operator, $param);
            $params[$param] = $value;
        }
    }

    /**
     * @param list<string> $conditions
     * @param array<string, mixed> $params
     * @param array<string, int> $types
     */
    private function addResourceCondition(NeutralResourceCondition $resource, int $index, array &$conditions, array &$params, array &$types): void
    {
        $valuesParam = sprintf('resourceValues%d', $index);

        if ($resource->isInstall) {
            $active = array_values(array_unique(array_map(static fn (int $value): string => $value > 0 ? 'true' : 'false', $resource->values)));
            $conditions[] = sprintf('o.%s_install_active::text IN (:%s)', $resource->side, $valuesParam);
            $params[$valuesParam] = $active;
            $types[$valuesParam] = ArrayParameterType::STRING;

            return;
        }

        $sideParam = sprintf('resourceSide%d', $index);
        $keyParam = sprintf('resourceKey%d', $index);
        $conditions[] = sprintf(
            'EXISTS (SELECT 1 FROM sf6.neutral_observation_resource nr WHERE nr.observation_id = o.id AND nr.side = :%s AND nr.source_key = :%s AND nr.value IN (:%s))',
            $sideParam,
            $keyParam,
            $valuesParam,
        );
        $params[$sideParam] = $resource->side;
        $params[$keyParam] = $resource->sourceKey;
        $params[$valuesParam] = $resource->values;
        $types[$valuesParam] = ArrayParameterType::INTEGER;
    }
}
