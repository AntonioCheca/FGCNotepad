<?php declare(strict_types=1);

namespace App\Service;

use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Uid\Uuid;

/**
 * Parses neutral stats query parameters (the same ones the page keeps in its URL) into normalized filters.
 * Malformed values are client errors; values equal to the defaults collapse to "not filtered".
 */
final class NeutralStatsFilterParser
{
    public const REGIONS = ['tokyo' => 'Tokyo', 'oregon' => 'Oregon', 'brazil' => 'Brazil', 'london' => 'London'];
    public const RELATIVE_MR_BUCKETS = [
        'much_lower' => ['Much lower (< -200)', null, -201],
        'lower' => ['Lower (-200 to -101)', -200, -101],
        'slightly_lower' => ['Slightly lower (-100 to 0)', -100, 0],
        'slightly_higher' => ['Slightly higher (+1 to +100)', 1, 100],
        'higher' => ['Higher (+101 to +200)', 101, 200],
        'much_higher' => ['Much higher (> +200)', 201, null],
    ];

    public function __construct(private readonly NeutralRankLadder $rankLadder)
    {
    }

    /** @param array<string, mixed> $query */
    public function parse(array $query): NeutralStatsFilters
    {
        $characterId = $this->uuid($query['character'] ?? null, 'character');
        if (null === $characterId) {
            throw new BadRequestHttpException('character is required.');
        }

        $bucketSize = $this->string($query['bucket'] ?? null) ?? NeutralStatsFilters::DEFAULT_BUCKET_SIZE;
        if (!in_array($bucketSize, NeutralStatsFilters::BUCKET_SIZES, true)) {
            throw new BadRequestHttpException('bucket must be one of ' . implode(', ', NeutralStatsFilters::BUCKET_SIZES) . '.');
        }

        $patch = $this->string($query['patch'] ?? null) ?? NeutralStatsFilters::PATCH_ALL;
        if (!in_array($patch, [NeutralStatsFilters::PATCH_ALL, NeutralStatsFilters::PATCH_LATEST], true)) {
            throw new BadRequestHttpException('patch must be all or latest.');
        }

        return new NeutralStatsFilters(
            characterId: $characterId,
            opponentId: $this->uuid($query['opponent'] ?? null, 'opponent'),
            regions: $this->allowedList($query['region'] ?? null, array_keys(self::REGIONS), 'region'),
            rankMin: $this->rankLadder->normalizeMinimum($this->string($query['rankMin'] ?? null)),
            rankMax: $this->rankLadder->normalizeMaximum($this->string($query['rankMax'] ?? null)),
            relativeMr: $this->allowedList($query['relMr'] ?? null, array_keys(self::RELATIVE_MR_BUCKETS), 'relMr'),
            actorGauges: $this->gauges($query, ''),
            opponentGauges: $this->gauges($query, 'opp'),
            actorResources: $this->resources($query['res'] ?? null, 'res'),
            opponentResources: $this->resources($query['oppRes'] ?? null, 'oppRes'),
            bucketSize: $bucketSize,
            patch: $patch,
        );
    }

    /** @param array<string, mixed> $query */
    private function gauges(array $query, string $prefix): NeutralGaugeFilter
    {
        $name = static fn (string $field): string => '' === $prefix ? lcfirst($field) : $prefix . $field;

        return new NeutralGaugeFilter(
            driveMin: $this->lowerBound($query[$name('DriveMin')] ?? null, NeutralGaugeFilter::DRIVE_BARS, $name('DriveMin')),
            driveMax: $this->upperBound($query[$name('DriveMax')] ?? null, NeutralGaugeFilter::DRIVE_BARS, $name('DriveMax')),
            superMin: $this->lowerBound($query[$name('SuperMin')] ?? null, NeutralGaugeFilter::SUPER_BARS, $name('SuperMin')),
            superMax: $this->upperBound($query[$name('SuperMax')] ?? null, NeutralGaugeFilter::SUPER_BARS, $name('SuperMax')),
            healthMin: $this->health($query[$name('HealthMin')] ?? null, $name('HealthMin'), true),
            healthMax: $this->health($query[$name('HealthMax')] ?? null, $name('HealthMax'), false),
        );
    }

    private function lowerBound(mixed $value, int $scaleMax, string $field): ?float
    {
        $number = $this->number($value, $scaleMax, $field);

        return null === $number || $number <= 0.0 ? null : $number;
    }

    private function upperBound(mixed $value, int $scaleMax, string $field): ?float
    {
        $number = $this->number($value, $scaleMax, $field);

        return null === $number || $number >= $scaleMax ? null : $number;
    }

    private function number(mixed $value, int $scaleMax, string $field): ?float
    {
        $text = $this->string($value);
        if (null === $text) {
            return null;
        }
        if (!is_numeric($text) || (float) $text < 0 || (float) $text > $scaleMax) {
            throw new BadRequestHttpException(sprintf('%s must be a number between 0 and %d.', $field, $scaleMax));
        }

        return round((float) $text, 2);
    }

    private function health(mixed $value, string $field, bool $isMinimum): ?int
    {
        $text = $this->string($value);
        if (null === $text) {
            return null;
        }
        if (1 !== preg_match('/^\d{1,5}$/', $text)) {
            throw new BadRequestHttpException(sprintf('%s must be a whole number of health points.', $field));
        }

        return $isMinimum && 0 === (int) $text ? null : (int) $text;
    }

    /** @return array<string, list<int>> */
    private function resources(mixed $value, string $field): array
    {
        if (null === $value) {
            return [];
        }
        if (!is_array($value)) {
            throw new BadRequestHttpException(sprintf('%s must be keyed by resource.', $field));
        }

        $resources = [];
        foreach ($value as $key => $csv) {
            if (!is_string($key) || 1 !== preg_match('/^[A-Za-z0-9_\-]{1,64}$/', $key) || !is_string($csv)) {
                throw new BadRequestHttpException(sprintf('%s contains an invalid resource.', $field));
            }
            $values = [];
            foreach ($this->csv($csv) as $entry) {
                if (1 !== preg_match('/^\d{1,3}$/', $entry)) {
                    throw new BadRequestHttpException(sprintf('%s[%s] must list whole numbers.', $field, $key));
                }
                $values[(int) $entry] = (int) $entry;
            }
            if ([] !== $values) {
                ksort($values);
                $resources[$key] = array_values($values);
            }
        }
        ksort($resources);

        return $resources;
    }

    /**
     * @param list<string> $allowed
     *
     * @return list<string>
     */
    private function allowedList(mixed $value, array $allowed, string $field): array
    {
        $text = $this->string($value);
        if (null === $text) {
            return [];
        }

        $selected = $this->csv($text);
        $unknown = array_diff($selected, $allowed);
        if ([] !== $unknown) {
            throw new BadRequestHttpException(sprintf('Unknown %s "%s".', $field, implode(', ', $unknown)));
        }

        return array_values(array_intersect($allowed, $selected));
    }

    /** @return list<string> */
    private function csv(string $text): array
    {
        return array_values(array_filter(array_map('trim', explode(',', $text)), static fn (string $entry): bool => '' !== $entry));
    }

    private function uuid(mixed $value, string $field): ?string
    {
        $text = $this->string($value);
        if (null === $text) {
            return null;
        }
        if (!Uuid::isValid($text)) {
            throw new BadRequestHttpException(sprintf('%s must be a character id.', $field));
        }

        return strtolower($text);
    }

    private function string(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }
        $trimmed = trim($value);

        return '' === $trimmed ? null : $trimmed;
    }
}
