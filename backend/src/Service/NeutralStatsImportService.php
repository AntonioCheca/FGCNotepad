<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\CharacterObject;
use App\Entity\NeutralObservation;
use App\Entity\NeutralObservationResource;
use App\Entity\Replay;
use App\Entity\ReplayPlayer;
use Doctrine\DBAL\Connection;
use Doctrine\DBAL\ParameterType;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * Imports a neutral_stats_bundle_v2 export. Each replay's neutral observations are replaced as a whole, so the
 * newest successful import is canonical. An observation whose move notation has no catalogue move is skipped and
 * reported; a replay whose players cannot be stored fails alone without stopping the bundle.
 */
final class NeutralStatsImportService
{
    public const FORMAT = 'neutral_stats_bundle_v2';
    private const TEXT_LIMIT = 64;

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly Connection $connection,
        private readonly ReplayContextImportService $replayContextImportService,
        private readonly NeutralMoveResolver $moveResolver,
        private readonly NeutralStatsRevision $revision,
        private readonly LoggerInterface $logger,
    ) {
    }

    /**
     * @param array<string, mixed> $bundle
     *
     * @return array{
     *     replayCount: int,
     *     importedReplayCount: int,
     *     observationCount: int,
     *     importedObservationCount: int,
     *     skippedObservationCount: int,
     *     unmappedMoves: list<array{character: string, notation: string, actionId: int|null, moveName: string|null, count: int}>,
     *     warnings: list<string>,
     *     replays: list<array{replayId: string, importedCount: int, skippedCount: int, error?: string}>
     * }
     */
    public function import(array $bundle): array
    {
        if (self::FORMAT !== ($bundle['format'] ?? null)) {
            throw new BadRequestHttpException(sprintf('Unsupported neutral stats format. Expected %s.', self::FORMAT));
        }
        if (!is_array($bundle['replays'] ?? null) || !array_is_list($bundle['replays'])) {
            throw new BadRequestHttpException('replays must be an array.');
        }

        $algorithmVersion = is_string($bundle['algorithm_version'] ?? null) ? mb_substr($bundle['algorithm_version'], 0, 16) : null;
        $report = new NeutralImportReport();
        $replays = [];

        foreach ($bundle['replays'] as $index => $document) {
            $replayId = is_array($document) && is_array($document['source'] ?? null) && is_string($document['source']['replay_id'] ?? null)
                ? $document['source']['replay_id']
                : sprintf('replays[%d]', $index);

            try {
                $replays[] = ['replayId' => $replayId] + $this->importReplay($document, $algorithmVersion, $report);
            } catch (BadRequestHttpException $exception) {
                $replays[] = ['replayId' => $replayId, 'importedCount' => 0, 'skippedCount' => 0, 'error' => $exception->getMessage()];
                $this->logger->warning('Neutral stats replay rejected', ['replayId' => $replayId, 'reason' => $exception->getMessage()]);
            } finally {
                $this->entityManager->clear();
                $this->replayContextImportService->clearCache();
                $this->moveResolver->clearCache();
            }
        }

        $importedReplays = array_values(array_filter($replays, static fn (array $replay): bool => !isset($replay['error'])));
        if ([] !== $importedReplays) {
            $this->revision->bump();
        }

        $summary = [
            'replayCount' => count($replays),
            'importedReplayCount' => count($importedReplays),
            'observationCount' => $report->observationCount,
            'importedObservationCount' => $report->importedCount,
            'skippedObservationCount' => $report->skippedCount(),
            'unmappedMoves' => $report->unmappedMoves(),
            'warnings' => $report->warnings(),
            'replays' => $replays,
        ];

        $this->logger->info('Neutral stats import finished', [
            'replayCount' => $summary['replayCount'],
            'importedReplayCount' => $summary['importedReplayCount'],
            'observationCount' => $summary['observationCount'],
            'importedObservationCount' => $summary['importedObservationCount'],
            'skippedObservationCount' => $summary['skippedObservationCount'],
        ]);
        foreach ($summary['unmappedMoves'] as $unmapped) {
            $this->logger->warning('Neutral stats move notation has no catalogue move', $unmapped);
        }

        return $summary;
    }

    /**
     * @return array{importedCount: int, skippedCount: int}
     */
    private function importReplay(mixed $document, ?string $algorithmVersion, NeutralImportReport $report): array
    {
        $observations = $this->validateReplay($document);
        $report->observationCount += count($observations);

        $replay = $this->replayContextImportService->upsert($document);
        $players = [1 => $replay->getPlayerBySlot(1), 2 => $replay->getPlayerBySlot(2)];
        $resourceKeys = array_map(fn (?ReplayPlayer $player): array => $this->resourceObjectIds($player), $players);

        $rows = [];
        $skipped = 0;
        foreach ($observations as $observation) {
            $row = $this->buildRow($observation, $players, $resourceKeys, $report);
            if (null === $row) {
                ++$skipped;
                continue;
            }
            $rows[] = $row;
        }

        $this->connection->transactional(function () use ($replay, $rows, $algorithmVersion): void {
            $this->connection->executeStatement('DELETE FROM sf6.neutral_observation WHERE replay_id = :replayId', ['replayId' => $replay->getId()]);
            foreach ($rows as $row) {
                $this->insertObservation((int) $replay->getId(), $row);
            }
            $replay->markNeutralImported($algorithmVersion);
            $this->entityManager->flush();
        });

        $report->importedCount += count($rows);

        return ['importedCount' => count($rows), 'skippedCount' => $skipped];
    }

    /** @return list<array<string, mixed>> */
    private function validateReplay(mixed $document): array
    {
        if (!is_array($document)) {
            throw new BadRequestHttpException('Replay entry must be an object.');
        }
        foreach (['replay_id', 'source_sha256'] as $field) {
            if (!is_array($document['source'] ?? null) || !is_string($document['source'][$field] ?? null) || '' === trim($document['source'][$field])) {
                throw new BadRequestHttpException(sprintf('source.%s must be a non-empty string.', $field));
            }
        }
        if (!is_array($document['observations'] ?? null) || !array_is_list($document['observations'])) {
            throw new BadRequestHttpException('observations must be an array.');
        }

        return array_values(array_filter($document['observations'], 'is_array'));
    }

    /**
     * @param array<string, mixed> $observation
     * @param array<int, ReplayPlayer|null> $players
     * @param array<int, array<string, int>> $resourceKeys
     *
     * @return array<string, mixed>|null
     */
    private function buildRow(array $observation, array $players, array $resourceKeys, NeutralImportReport $report): ?array
    {
        $actorSlot = $observation['player_slot'] ?? null;
        $opponentSlot = $observation['opponent_slot'] ?? null;
        $sourceId = $this->text($observation['id'] ?? null, 96);
        $notation = $this->text($observation['notation'] ?? null, self::TEXT_LIMIT);
        $route = $observation['route'] ?? null;
        $spacing = $observation['spacing'] ?? null;

        if (!in_array($actorSlot, [1, 2], true) || !in_array($opponentSlot, [1, 2], true) || $actorSlot === $opponentSlot
            || null === $sourceId || null === $notation || !in_array($route, NeutralObservation::ROUTES, true)
            || (!is_float($spacing) && !is_int($spacing)) || $spacing < 0) {
            $report->addWarning(sprintf('Observation %s is incomplete and was skipped.', $sourceId ?? '(without id)'));

            return null;
        }

        $actor = $players[$actorSlot];
        $opponent = $players[$opponentSlot];
        $character = $actor?->getCharacter();
        if (null === $actor || null === $opponent || null === $character) {
            $report->addWarning(sprintf('Character "%s" is not in FGCNotepad; its observations were skipped.', $actor?->getCharacterName() ?? sprintf('slot %d', $actorSlot)));

            return null;
        }

        $actionId = $this->int32($observation['action_id'] ?? null);
        $moveId = $this->moveResolver->resolve($character, $notation);
        if (null === $moveId) {
            $report->addUnmapped($character->getName(), $notation, $actionId, $this->text($observation['move_name'] ?? null, 128));

            return null;
        }

        $states = $this->statesBySlot($observation['player_states'] ?? null);
        $actorState = $states[$actorSlot] ?? [];
        $opponentState = $states[$opponentSlot] ?? [];

        return [
            'source_observation_id' => $sourceId,
            'actor_player_id' => $actor->getId(),
            'opponent_player_id' => $opponent->getId(),
            'character_id' => (string) $character->getId(),
            'opponent_character_id' => null === $opponent->getCharacter() ? null : (string) $opponent->getCharacter()->getId(),
            'move_id' => $moveId,
            'action_id' => $actionId,
            'route' => $route,
            'spacing' => (float) $spacing,
            'catalogue_category' => $this->text($observation['catalogue_category'] ?? null, self::TEXT_LIMIT),
            'entered_from' => $this->text($observation['entered_from'] ?? null, 32),
            'round_number' => $this->smallInt($observation['round_number'] ?? null),
            'round_timer' => $this->smallInt($observation['round_timer'] ?? null),
            'replay_frame' => $this->int32($observation['replay_frame'] ?? null),
            'source_index' => $this->int32($observation['source_index'] ?? null),
            ...$this->stateColumns('actor', $actorState),
            ...$this->stateColumns('opponent', $opponentState),
            'resources' => [
                ...$this->resourceRows(NeutralObservationResource::SIDE_ACTOR, $actorState, $resourceKeys[$actorSlot]),
                ...$this->resourceRows(NeutralObservationResource::SIDE_OPPONENT, $opponentState, $resourceKeys[$opponentSlot]),
            ],
        ];
    }

    /** @return array<int, array<string, mixed>> */
    private function statesBySlot(mixed $states): array
    {
        $bySlot = [];
        foreach (is_array($states) ? $states : [] as $state) {
            if (is_array($state) && in_array($state['slot'] ?? null, [1, 2], true)) {
                $bySlot[$state['slot']] = $state;
            }
        }

        return $bySlot;
    }

    /**
     * @param array<string, mixed> $state
     *
     * @return array<string, int|bool|null>
     */
    private function stateColumns(string $prefix, array $state): array
    {
        $install = is_array($state['install'] ?? null) ? $state['install'] : [];

        return [
            $prefix . '_health' => $this->int32($state['health'] ?? null),
            $prefix . '_drive' => $this->int32($state['drive'] ?? null),
            $prefix . '_super' => $this->int32($state['super'] ?? null),
            $prefix . '_install_active' => is_bool($install['active'] ?? null) ? $install['active'] : null,
            $prefix . '_install_remaining' => $this->int32($install['remaining'] ?? null),
        ];
    }

    /**
     * @param array<string, mixed> $state
     * @param array<string, int> $objectIdsByKey
     *
     * @return list<array{side: string, source_key: string, value: int, character_object_id: int|null}>
     */
    private function resourceRows(string $side, array $state, array $objectIdsByKey): array
    {
        $rows = [];
        foreach (is_array($state['resources'] ?? null) ? $state['resources'] : [] as $key => $entry) {
            $sourceKey = $this->text((string) $key, self::TEXT_LIMIT);
            $value = is_array($entry) ? $this->int32($entry['value'] ?? null) : null;
            if (null === $sourceKey || null === $value) {
                continue;
            }
            $rows[] = ['side' => $side, 'source_key' => $sourceKey, 'value' => $value, 'character_object_id' => $objectIdsByKey[$sourceKey] ?? null];
        }

        return $rows;
    }

    /** @return array<string, int> extractor key => character object id */
    private function resourceObjectIds(?ReplayPlayer $player): array
    {
        $character = $player?->getCharacter();
        if (null === $character) {
            return [];
        }

        $rows = $this->connection->fetchAllAssociative(
            'SELECT id, extractor_key FROM sf6.character_object WHERE character_id = :characterId AND extractor_source = :source AND extractor_key IS NOT NULL',
            ['characterId' => (string) $character->getId(), 'source' => CharacterObject::SOURCE_NAMED],
        );

        $ids = [];
        foreach ($rows as $row) {
            $ids[trim((string) $row['extractor_key'])] = (int) $row['id'];
        }

        return $ids;
    }

    /** @param array<string, mixed> $row */
    private function insertObservation(int $replayId, array $row): void
    {
        $resources = $row['resources'];
        unset($row['resources']);
        $row['replay_id'] = $replayId;

        $columns = array_keys($row);
        $observationId = $this->connection->fetchOne(
            sprintf(
                'INSERT INTO sf6.neutral_observation (%s) VALUES (%s) RETURNING id',
                implode(', ', $columns),
                implode(', ', array_map(static fn (string $column): string => ':' . $column, $columns)),
            ),
            $row,
            array_map(static fn (): int => ParameterType::BOOLEAN, array_filter($row, 'is_bool')),
        );

        foreach ($resources as $resource) {
            $this->connection->insert('sf6.neutral_observation_resource', ['observation_id' => (int) $observationId] + $resource);
        }
    }

    private function text(mixed $value, int $limit): ?string
    {
        if (!is_string($value)) {
            return null;
        }
        $clean = trim(str_replace("\0", '', mb_scrub($value, 'UTF-8')));

        return '' === $clean ? null : mb_substr($clean, 0, $limit, 'UTF-8');
    }

    private function int32(mixed $value): ?int
    {
        return is_int($value) && $value >= -2147483648 && $value <= 2147483647 ? $value : null;
    }

    private function smallInt(mixed $value): ?int
    {
        return is_int($value) && $value >= -32768 && $value <= 32767 ? $value : null;
    }
}
