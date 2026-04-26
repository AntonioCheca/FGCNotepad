<?php declare(strict_types=1);

namespace App\Service;

use App\Util\Enum\ModerationState;
use Doctrine\DBAL\Connection;

class ModerationQueueService
{
    private const ALLOWED_CONTENT_TYPES = ['post', 'combo', 'scenario'];
    private const ALLOWED_SORT_VALUES = ['oldest', 'newest'];

    public function __construct(
        private readonly Connection $connection,
    ) {
    }

    /**
     * @param list<string> $contentTypes
     * @param list<string> $states
     *
     * @return array{data:list<array<string,mixed>>,meta:array<string,mixed>}
     */
    public function getQueue(array $contentTypes, array $states, string $sort): array
    {
        $normalizedContentTypes = $this->normalizeContentTypes($contentTypes);
        $normalizedStates = $this->normalizeStates($states);
        $normalizedSort = $this->normalizeSort($sort);

        $rows = [];
        if (in_array('post', $normalizedContentTypes, true)) {
            $rows = array_merge($rows, $this->fetchPostRows());
        }
        if (in_array('combo', $normalizedContentTypes, true)) {
            $rows = array_merge($rows, $this->fetchComboRows());
        }
        if (in_array('scenario', $normalizedContentTypes, true)) {
            $rows = array_merge($rows, $this->fetchScenarioRows());
        }

        $includeFlagged = in_array('flagged', $normalizedStates, true);
        $moderationStates = array_values(array_filter(
            $normalizedStates,
            static fn (string $state): bool => 'flagged' !== $state
        ));

        $filtered = array_values(array_filter(
            $rows,
            static function (array $row) use ($includeFlagged, $moderationStates): bool {
                $matchesState = in_array((string) ($row['state'] ?? ''), $moderationStates, true);
                $flagCount = (int) ($row['flagCount'] ?? 0);
                $matchesFlagged = $includeFlagged && $flagCount > 0;

                return $matchesState || $matchesFlagged;
            }
        ));

        usort($filtered, static function (array $left, array $right) use ($normalizedSort): int {
            $leftDate = (string) ($left['createdAt'] ?? '');
            $rightDate = (string) ($right['createdAt'] ?? '');

            if ($leftDate === $rightDate) {
                return strcmp((string) ($left['contentId'] ?? ''), (string) ($right['contentId'] ?? ''));
            }

            return 'oldest' === $normalizedSort
                ? strcmp($leftDate, $rightDate)
                : strcmp($rightDate, $leftDate);
        });

        return [
            'data' => $filtered,
            'meta' => [
                'total' => count($filtered),
                'filters' => [
                    'contentType' => $normalizedContentTypes,
                    'state' => $normalizedStates,
                    'sort' => $normalizedSort,
                ],
            ],
        ];
    }

    /**
     * @param list<string> $contentTypes
     *
     * @return list<string>
     */
    private function normalizeContentTypes(array $contentTypes): array
    {
        $normalized = [];
        foreach ($contentTypes as $contentType) {
            $candidate = trim(mb_strtolower($contentType));
            if ('' === $candidate) {
                continue;
            }
            if (!in_array($candidate, self::ALLOWED_CONTENT_TYPES, true)) {
                throw new \InvalidArgumentException(sprintf('Invalid contentType filter: %s', $contentType));
            }
            $normalized[$candidate] = $candidate;
        }

        if ([] === $normalized) {
            return self::ALLOWED_CONTENT_TYPES;
        }

        return array_values($normalized);
    }

    /**
     * @param list<string> $states
     *
     * @return list<string>
     */
    private function normalizeStates(array $states): array
    {
        $normalized = [];
        foreach ($states as $state) {
            $candidate = trim(mb_strtolower($state));
            if ('' === $candidate) {
                continue;
            }

            if ('flagged' !== $candidate && !ModerationState::isValid($candidate)) {
                throw new \InvalidArgumentException(sprintf('Invalid state filter: %s', $state));
            }

            $normalized[$candidate] = $candidate;
        }

        if ([] === $normalized) {
            return [ModerationState::PENDING_REVIEW->value, 'flagged'];
        }

        return array_values($normalized);
    }

    private function normalizeSort(string $sort): string
    {
        $normalized = trim(mb_strtolower($sort));
        if ('' === $normalized) {
            return 'oldest';
        }
        if (!in_array($normalized, self::ALLOWED_SORT_VALUES, true)) {
            throw new \InvalidArgumentException(sprintf('Invalid sort filter: %s', $sort));
        }

        return $normalized;
    }

    /**
     * @return list<array<string,mixed>>
     */
    private function fetchPostRows(): array
    {
        $rows = $this->connection->executeQuery(<<<'SQL'
            SELECT
                p.id::text AS content_id,
                'post' AS content_type,
                p.title AS title,
                COALESCE(u.username, 'UNKNOWN_USER') AS author,
                p.moderation_state AS state,
                p.created_at AS created_at,
                p.last_modified AS updated_at,
                0 AS flag_count
            FROM forum.post p
            LEFT JOIN forum."user" u ON u.id = p.author_id
        SQL)->fetchAllAssociative();

        return array_map(static fn (array $row): array => [
            'contentId' => (string) $row['content_id'],
            'contentType' => (string) $row['content_type'],
            'title' => (string) $row['title'],
            'author' => (string) $row['author'],
            'state' => (string) $row['state'],
            'createdAt' => self::normalizeDateValue($row['created_at'] ?? null),
            'updatedAt' => self::normalizeDateValue($row['updated_at'] ?? null),
            'flagCount' => (int) $row['flag_count'],
        ], $rows);
    }

    /**
     * @return list<array<string,mixed>>
     */
    private function fetchComboRows(): array
    {
        $rows = $this->connection->executeQuery(<<<'SQL'
            SELECT
                cs.id::text AS content_id,
                'combo' AS content_type,
                cs.name AS title,
                COALESCE(u.username, 'UNKNOWN_USER') AS author,
                cs.moderation_state AS state,
                COALESCE(cs.submitted_for_review_at, cs.moderation_decided_at) AS created_at,
                COALESCE(cs.moderation_decided_at, cs.submitted_for_review_at) AS updated_at,
                COALESCE(cf.flag_count, 0) AS flag_count
            FROM sf6.combo_sequence cs
            LEFT JOIN forum."user" u ON u.id = cs.author_id
            LEFT JOIN (
                SELECT combo_id, COUNT(*) AS flag_count
                FROM sf6.combo_flag
                GROUP BY combo_id
            ) cf ON cf.combo_id = cs.id
        SQL)->fetchAllAssociative();

        return array_map(static fn (array $row): array => [
            'contentId' => (string) $row['content_id'],
            'contentType' => (string) $row['content_type'],
            'title' => (string) $row['title'],
            'author' => (string) $row['author'],
            'state' => (string) $row['state'],
            'createdAt' => self::normalizeDateValue($row['created_at'] ?? null),
            'updatedAt' => self::normalizeDateValue($row['updated_at'] ?? null),
            'flagCount' => (int) $row['flag_count'],
        ], $rows);
    }

    /**
     * @return list<array<string,mixed>>
     */
    private function fetchScenarioRows(): array
    {
        $rows = $this->connection->executeQuery(<<<'SQL'
            SELECT
                s.public_id::text AS content_id,
                'scenario' AS content_type,
                s.name AS title,
                COALESCE(u.username, 'UNKNOWN_USER') AS author,
                s.moderation_state AS state,
                s.created_at AS created_at,
                s.updated_at AS updated_at,
                COALESCE(sf.flag_count, 0) AS flag_count
            FROM sf6.scenario s
            LEFT JOIN forum."user" u ON u.id = s.author_id
            LEFT JOIN (
                SELECT scenario_id, COUNT(*) AS flag_count
                FROM sf6.scenario_flag
                GROUP BY scenario_id
            ) sf ON sf.scenario_id = s.id
        SQL)->fetchAllAssociative();

        return array_map(static fn (array $row): array => [
            'contentId' => (string) $row['content_id'],
            'contentType' => (string) $row['content_type'],
            'title' => (string) $row['title'],
            'author' => (string) $row['author'],
            'state' => (string) $row['state'],
            'createdAt' => self::normalizeDateValue($row['created_at'] ?? null),
            'updatedAt' => self::normalizeDateValue($row['updated_at'] ?? null),
            'flagCount' => (int) $row['flag_count'],
        ], $rows);
    }

    private static function normalizeDateValue(mixed $value): string
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format(DATE_ATOM);
        }

        $stringValue = is_string($value) ? trim($value) : '';
        if ('' === $stringValue) {
            return '';
        }

        return (new \DateTimeImmutable($stringValue))->format(DATE_ATOM);
    }
}
