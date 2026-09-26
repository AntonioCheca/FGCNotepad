<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\NeutralObservation;

/**
 * Turns (move, route, spacing bucket) counts into render-ready charts.
 *
 * Move Profiles: one card per move + route, raw counts for every bucket (zeros included), a shared Y max and cards
 * sorted by usage. Raw-route cards carry the move's effective reach (max range plus the average opponent hurtbox extension); Drive
 * Rush changes the reach, so theirs is null. Neutral Distribution: the busiest bucket is 100% and every bucket's stack is scaled against it;
 * within a bucket the height splits by move, and moves under 2% of all observations are grouped as Other. Series run
 * in the fixed family order and by usage within a family; share is each series' percentage of all observations.
 */
final class NeutralStatsChartBuilder
{
    public const TOP_CARD_LIMIT = 24;
    public const OTHER_SHARE_THRESHOLD = 0.02;
    /**
     * FAT range is measured to the opponent's body, but neutral buttons land on limbs sticking out ahead of it. This
     * average extended-hurtbox allowance moves the marker to where moves really connect (2MP: 1.25 -> ~1.70).
     */
    public const AVERAGE_OPPONENT_HURTBOX_EXTENSION = 0.45;

    public function __construct(private readonly NeutralMoveFamilyClassifier $familyClassifier)
    {
    }

    /**
     * @param list<array{moveId: string, route: string, bucket: int, count: int, catalogueCategory: string|null}> $rows
     * @param array<string, array{notation: string, name: string|null, moveType: string|null, maxRange: float|null}> $moveDetails
     *
     * @return array{
     *     observationCount: int,
     *     moveProfiles: array{yMax: int, topLimit: int, cards: list<array<string, mixed>>},
     *     distribution: array{series: list<array<string, mixed>>}
     * }
     */
    public function build(array $rows, array $moveDetails, int $bucketCount): array
    {
        $entries = $this->entries($rows, $moveDetails, $bucketCount);
        $observationCount = array_sum(array_column($entries, 'total'));

        return [
            'observationCount' => $observationCount,
            'moveProfiles' => $this->moveProfiles($entries),
            'distribution' => ['series' => $this->distribution($entries, $observationCount, $bucketCount)],
        ];
    }

    /**
     * @param list<array{moveId: string, route: string, bucket: int, count: int, catalogueCategory: string|null}> $rows
     * @param array<string, array{notation: string, name: string|null, moveType: string|null, maxRange: float|null}> $moveDetails
     *
     * @return list<array{key: string, label: string, notation: string, name: string|null, route: string, maxRange: float|null, family: string, isOd: bool, total: int, counts: list<int>}>
     */
    private function entries(array $rows, array $moveDetails, int $bucketCount): array
    {
        $entries = [];
        foreach ($rows as $row) {
            $key = $row['moveId'] . ':' . $row['route'];
            if (!isset($entries[$key])) {
                $details = $moveDetails[$row['moveId']] ?? ['notation' => '?', 'name' => null, 'moveType' => null, 'maxRange' => null];
                $family = $this->familyClassifier->family($row['route'], $details['notation'], $details['moveType'], $row['catalogueCategory']);
                $entries[$key] = [
                    'key' => $key,
                    'label' => NeutralObservation::ROUTE_DRIVE_RUSH === $row['route'] ? 'DR > ' . $details['notation'] : $details['notation'],
                    'notation' => $details['notation'],
                    'name' => $details['name'],
                    'route' => $row['route'],
                    'maxRange' => NeutralObservation::ROUTE_RAW === $row['route'] ? $this->effectiveReach($details['maxRange']) : null,
                    'family' => $family,
                    'isOd' => $this->familyClassifier->isOd($family, $details['notation']),
                    'total' => 0,
                    'counts' => array_fill(0, $bucketCount, 0),
                ];
            }
            $bucket = min(max($row['bucket'], 0), $bucketCount - 1);
            $entries[$key]['counts'][$bucket] += $row['count'];
            $entries[$key]['total'] += $row['count'];
        }

        $entries = array_values($entries);
        usort($entries, static fn (array $left, array $right): int => [$right['total'], $left['label']] <=> [$left['total'], $right['label']]);

        return $entries;
    }

    /**
     * @param list<array{key: string, label: string, name: string|null, route: string, maxRange: float|null, total: int, counts: list<int>}> $entries
     *
     * @return array{yMax: int, topLimit: int, cards: list<array<string, mixed>>}
     */
    private function moveProfiles(array $entries): array
    {
        $yMax = 0;
        $cards = [];
        foreach ($entries as $entry) {
            $yMax = max($yMax, 0 === count($entry['counts']) ? 0 : max($entry['counts']));
            $cards[] = [
                'key' => $entry['key'],
                'label' => $entry['label'],
                'name' => $entry['name'],
                'route' => $entry['route'],
                'maxRange' => $entry['maxRange'],
                'total' => $entry['total'],
                'counts' => $entry['counts'],
            ];
        }

        return ['yMax' => $yMax, 'topLimit' => self::TOP_CARD_LIMIT, 'cards' => $cards];
    }

    /**
     * @param list<array{key: string, label: string, family: string, isOd: bool, total: int, counts: list<int>}> $entries
     *
     * @return list<array{key: string, label: string, family: string, isOd: bool, total: int, share: float, values: list<float>}>
     */
    private function distribution(array $entries, int $observationCount, int $bucketCount): array
    {
        if (0 === $observationCount) {
            return [];
        }

        $bucketTotals = array_fill(0, $bucketCount, 0);
        foreach ($entries as $entry) {
            foreach ($entry['counts'] as $bucket => $count) {
                $bucketTotals[$bucket] += $count;
            }
        }
        $busiest = max($bucketTotals);

        $series = [];
        $other = ['key' => 'other', 'label' => 'Other', 'family' => NeutralMoveFamilyClassifier::OTHER, 'isOd' => false, 'total' => 0, 'counts' => array_fill(0, $bucketCount, 0)];
        foreach ($entries as $entry) {
            if ($entry['total'] / $observationCount < self::OTHER_SHARE_THRESHOLD) {
                $other['total'] += $entry['total'];
                foreach ($entry['counts'] as $bucket => $count) {
                    $other['counts'][$bucket] += $count;
                }
                continue;
            }
            $series[] = $entry;
        }
        if ($other['total'] > 0) {
            $series[] = $other;
        }

        $familyOrder = array_flip(NeutralMoveFamilyClassifier::ORDER);
        usort($series, static fn (array $left, array $right): int => [$familyOrder[$left['family']], $right['total'], $left['label']] <=> [$familyOrder[$right['family']], $left['total'], $right['label']]);

        return array_map(static fn (array $entry): array => [
            'key' => $entry['key'],
            'label' => $entry['label'],
            'family' => $entry['family'],
            'isOd' => $entry['isOd'],
            'total' => $entry['total'],
            'share' => round($entry['total'] / $observationCount * 100, 1),
            'values' => array_map(static fn (int $count): float => round($count / $busiest * 100, 3), $entry['counts']),
        ], $series);
    }

    private function effectiveReach(?float $maxRange): ?float
    {
        return null === $maxRange ? null : round($maxRange + self::AVERAGE_OPPONENT_HURTBOX_EXTENSION, 3);
    }
}
