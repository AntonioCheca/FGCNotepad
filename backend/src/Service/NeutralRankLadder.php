<?php declare(strict_types=1);

namespace App\Service;

use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * One ordered ladder across LP and MR: every League rank (league_rank 1-35, Rookie 1 to Diamond 5) sits below every
 * Master, and Masters are ordered by MR, which has no floor. Legend is the top-500 state and only works as a minimum.
 *
 * Bounds are tokens: "lp:<league rank>", "mr:<rating>" or "legend"; a missing bound means no limit.
 */
final class NeutralRankLadder
{
    public const DEFAULT_MINIMUM = 'mr:1800';
    public const NO_MINIMUM = 'any';

    private const TIERS = ['Rookie', 'Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    private const LAST_LEAGUE_RANK = 35;
    private const MAX_RATING = 5000;
    private const MASTER_BANDS = [
        ['Master', 0, 1599],
        ['High Master', 1600, 1699],
        ['Grand Master', 1700, 1799],
        ['Ultimate Master', 1800, null],
    ];

    /** @return array{minimum: list<array{value: string, label: string}>, maximum: list<array{value: string, label: string}>} */
    public function options(): array
    {
        $league = [];
        foreach (self::TIERS as $tierIndex => $tier) {
            for ($division = 1; $division <= 5; ++$division) {
                $league[] = ['value' => sprintf('lp:%d', $tierIndex * 5 + $division), 'label' => sprintf('%s %d', $tier, $division)];
            }
        }

        $minimum = $league;
        $maximum = $league;
        foreach (self::MASTER_BANDS as [$label, $floor, $ceiling]) {
            $minimum[] = ['value' => sprintf('mr:%d', $floor), 'label' => $label];
            if (null !== $ceiling) {
                $maximum[] = ['value' => sprintf('mr:%d', $ceiling), 'label' => $label];
            }
        }
        $minimum[] = ['value' => 'legend', 'label' => 'Legend'];

        return ['minimum' => $minimum, 'maximum' => $maximum];
    }

    /** Null means no minimum; an absent parameter falls back to the default. */
    public function normalizeMinimum(?string $token): ?string
    {
        if (null === $token || '' === trim($token)) {
            return self::DEFAULT_MINIMUM;
        }

        return self::NO_MINIMUM === trim($token) ? null : $this->normalize($token, true);
    }

    public function normalizeMaximum(?string $token): ?string
    {
        return null === $token || '' === trim($token) ? null : $this->normalize($token, false);
    }

    /**
     * SQL condition over a replay_player alias for the given bounds.
     *
     * @return array{sql: string, params: array<string, int>}
     */
    public function condition(string $alias, ?string $minimum, ?string $maximum, string $paramPrefix): array
    {
        $master = sprintf('%s.is_master IS TRUE', $alias);
        $league = sprintf('(%s.is_master IS NOT TRUE AND %s.league_rank BETWEEN 1 AND %d)', $alias, $alias, self::LAST_LEAGUE_RANK);
        $conditions = [];
        $params = [];

        if (null !== $minimum) {
            [$kind, $value] = $this->split($minimum);
            $param = $paramPrefix . 'Min';
            $conditions[] = match ($kind) {
                'lp' => sprintf('(%s OR (%s.is_master IS NOT TRUE AND %s.league_rank BETWEEN :%s AND %d))', $master, $alias, $alias, $param, self::LAST_LEAGUE_RANK),
                'mr' => sprintf('(%s AND %s.master_rating >= :%s)', $master, $alias, $param),
                default => sprintf('%s.is_legend IS TRUE', $alias),
            };
            if ('legend' !== $kind) {
                $params[$param] = $value;
            }
        }

        if (null !== $maximum) {
            [$kind, $value] = $this->split($maximum);
            $param = $paramPrefix . 'Max';
            $conditions[] = 'lp' === $kind
                ? sprintf('(%s.is_master IS NOT TRUE AND %s.league_rank BETWEEN 1 AND :%s)', $alias, $alias, $param)
                : sprintf('(%s OR (%s AND %s.master_rating <= :%s))', $league, $master, $alias, $param);
            $params[$param] = $value;
        }

        return ['sql' => [] === $conditions ? 'TRUE' : implode(' AND ', $conditions), 'params' => $params];
    }

    private function normalize(string $token, bool $isMinimum): string
    {
        $token = strtolower(trim($token));
        if ('legend' === $token && $isMinimum) {
            return $token;
        }
        if (1 === preg_match('/^lp:(\d{1,2})$/', $token, $matches) && (int) $matches[1] >= 1 && (int) $matches[1] <= self::LAST_LEAGUE_RANK) {
            return sprintf('lp:%d', (int) $matches[1]);
        }
        if (1 === preg_match('/^mr:(\d{1,4})$/', $token, $matches) && (int) $matches[1] <= self::MAX_RATING) {
            return sprintf('mr:%d', (int) $matches[1]);
        }

        throw new BadRequestHttpException(sprintf('Invalid rank %s "%s".', $isMinimum ? 'minimum' : 'maximum', $token));
    }

    /** @return array{0: string, 1: int} */
    private function split(string $token): array
    {
        if ('legend' === $token) {
            return ['legend', 0];
        }
        [$kind, $value] = explode(':', $token, 2);

        return [$kind, (int) $value];
    }
}
