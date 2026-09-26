<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Character;
use App\Entity\NeutralObservationResource;
use App\Repository\CharacterRepository;
use App\Repository\NeutralObservationRepository;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Contracts\Cache\CacheInterface;

/**
 * Public Neutral Stats: filter options and filtered, render-ready aggregates. Aggregates are cached under the
 * neutral data revision, the latest frame data import and the normalized filters, so either kind of import retires
 * every entry.
 */
final class NeutralStatsService
{
    public const LOW_SAMPLE_THRESHOLD = 50;
    /** Bump when the response shape changes so entries cached under the old shape are never served. */
    private const RESPONSE_VERSION = 4;

    public function __construct(
        private readonly NeutralObservationRepository $observationRepository,
        private readonly CharacterRepository $characterRepository,
        private readonly NeutralResourceCatalog $resourceCatalog,
        private readonly NeutralStatsChartBuilder $chartBuilder,
        private readonly NeutralRankLadder $rankLadder,
        private readonly NeutralStatsRevision $revision,
        private readonly CacheInterface $cache,
    ) {
    }

    /** @return array<string, mixed> */
    public function options(?string $characterId, ?string $opponentId): array
    {
        $character = null === $characterId ? null : $this->character($characterId);
        $opponent = null === $opponentId ? null : $this->character($opponentId);

        return [
            'characters' => array_map(
                static fn (Character $entry): array => ['id' => (string) $entry->getId(), 'name' => $entry->getName(), 'life' => $entry->getLife()],
                $this->characterRepository->findBy([], ['name' => 'ASC']),
            ),
            'ranks' => $this->rankLadder->options(),
            'defaultRankMin' => NeutralRankLadder::DEFAULT_MINIMUM,
            'regions' => $this->labelled(NeutralStatsFilterParser::REGIONS),
            'relativeMr' => $this->labelled(array_map(static fn (array $bucket): string => $bucket[0], NeutralStatsFilterParser::RELATIVE_MR_BUCKETS)),
            'bucketSizes' => NeutralStatsFilters::BUCKET_SIZES,
            'defaultBucketSize' => NeutralStatsFilters::DEFAULT_BUCKET_SIZE,
            'gauges' => ['driveBars' => NeutralGaugeFilter::DRIVE_BARS, 'superBars' => NeutralGaugeFilter::SUPER_BARS],
            'resources' => [
                'actor' => null === $character ? [] : $this->resourceCatalog->options($character),
                'opponent' => null === $opponent ? [] : $this->resourceCatalog->options($opponent),
            ],
        ];
    }

    /** @return array<string, mixed> */
    public function stats(NeutralStatsFilters $filters): array
    {
        $character = $this->character($filters->characterId);
        $opponent = null === $filters->opponentId ? null : $this->character($filters->opponentId);
        $key = sprintf(
            'neutral_stats.v%d.%s.fd%d.%s',
            self::RESPONSE_VERSION,
            $this->revision->current(),
            $this->observationRepository->latestFrameDataImportId(),
            $filters->cacheKey(),
        );

        return $this->cache->get($key, fn (): array => $this->compute($filters, $character, $opponent));
    }

    /** @return array<string, mixed> */
    private function compute(NeutralStatsFilters $filters, Character $character, ?Character $opponent): array
    {
        $resourceConditions = $this->resourceCatalog->conditions($character, $filters->actorResources, NeutralObservationResource::SIDE_ACTOR);
        if (null !== $opponent) {
            $resourceConditions = [
                ...$resourceConditions,
                ...$this->resourceCatalog->conditions($opponent, $filters->opponentResources, NeutralObservationResource::SIDE_OPPONENT),
            ];
        }

        $battleVersion = NeutralStatsFilters::PATCH_LATEST === $filters->patch ? $this->observationRepository->latestBattleVersion() : null;
        $bucketSize = (float) $filters->bucketSize;
        $xMax = $this->observationRepository->maxSpacingForCharacter($filters->characterId);
        $bucketCount = null === $xMax ? 0 : (int) floor($xMax / $bucketSize) + 1;

        $rows = 0 === $bucketCount ? [] : $this->observationRepository->countByMoveRouteAndBucket($filters, $resourceConditions, $battleVersion);
        $moveDetails = $this->observationRepository->moveDetails(array_values(array_unique(array_column($rows, 'moveId'))));
        $charts = $this->chartBuilder->build($rows, $moveDetails, $bucketCount);
        $replayCount = 0 === $charts['observationCount'] ? 0 : $this->observationRepository->countReplays($filters, $resourceConditions, $battleVersion);

        return [
            'character' => ['id' => (string) $character->getId(), 'name' => $character->getName()],
            'opponent' => null === $opponent ? null : ['id' => (string) $opponent->getId(), 'name' => $opponent->getName()],
            'sample' => [
                'observationCount' => $charts['observationCount'],
                'replayCount' => $replayCount,
                'lowSample' => $charts['observationCount'] < self::LOW_SAMPLE_THRESHOLD,
            ],
            'spacing' => [
                'bucketSize' => $bucketSize,
                'xMax' => round($bucketCount * $bucketSize, 4),
                'buckets' => array_map(
                    static fn (int $index): array => ['start' => round($index * $bucketSize, 4), 'end' => round(($index + 1) * $bucketSize, 4)],
                    0 === $bucketCount ? [] : range(0, $bucketCount - 1),
                ),
            ],
            'moveProfiles' => $charts['moveProfiles'],
            'distribution' => $charts['distribution'],
        ];
    }

    private function character(string $id): Character
    {
        $character = $this->characterRepository->find($id);
        if (!$character instanceof Character) {
            throw new NotFoundHttpException('Character not found.');
        }

        return $character;
    }

    /**
     * @param array<string, string> $labels
     *
     * @return list<array{value: string, label: string}>
     */
    private function labelled(array $labels): array
    {
        return array_map(static fn (string $value, string $label): array => ['value' => $value, 'label' => $label], array_keys($labels), $labels);
    }
}
