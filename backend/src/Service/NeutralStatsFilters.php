<?php declare(strict_types=1);

namespace App\Service;

/**
 * Normalized neutral stats filter state. Default values are stored as null so that equivalent requests share one
 * cache key. Drive and Super are in bars (the application scale), Health in raw points.
 */
final class NeutralStatsFilters
{
    public const BUCKET_SIZES = ['0.1', '0.25', '0.5', '1'];
    public const DEFAULT_BUCKET_SIZE = '0.25';
    public const PATCH_ALL = 'all';
    public const PATCH_LATEST = 'latest';

    /**
     * @param list<string> $regions
     * @param list<string> $relativeMr
     * @param array<string, list<int>> $actorResources object key => accepted values
     * @param array<string, list<int>> $opponentResources
     */
    public function __construct(
        public readonly string $characterId,
        public readonly ?string $opponentId = null,
        public readonly array $regions = [],
        public readonly ?string $rankMin = NeutralRankLadder::DEFAULT_MINIMUM,
        public readonly ?string $rankMax = null,
        public readonly array $relativeMr = [],
        public readonly NeutralGaugeFilter $actorGauges = new NeutralGaugeFilter(),
        public readonly NeutralGaugeFilter $opponentGauges = new NeutralGaugeFilter(),
        public readonly array $actorResources = [],
        public readonly array $opponentResources = [],
        public readonly string $bucketSize = self::DEFAULT_BUCKET_SIZE,
        public readonly string $patch = self::PATCH_ALL,
    ) {
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'character' => $this->characterId,
            'opponent' => $this->opponentId,
            'regions' => $this->regions,
            'rankMin' => $this->rankMin,
            'rankMax' => $this->rankMax,
            'relativeMr' => $this->relativeMr,
            'actor' => $this->actorGauges->toArray(),
            'opponentGauges' => null === $this->opponentId ? null : $this->opponentGauges->toArray(),
            'actorResources' => $this->actorResources,
            'opponentResources' => null === $this->opponentId ? [] : $this->opponentResources,
            'bucketSize' => $this->bucketSize,
            'patch' => $this->patch,
        ];
    }

    public function cacheKey(): string
    {
        return hash('sha256', json_encode($this->toArray(), JSON_THROW_ON_ERROR));
    }
}
