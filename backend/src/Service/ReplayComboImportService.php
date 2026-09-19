<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Character;
use App\Entity\ComboSequences;
use App\Entity\ConnectionType;
use App\Entity\User;
use App\Repository\CharacterRepository;
use App\Repository\ComboSequencesRepository;
use App\Repository\ConnectionTypeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class ReplayComboImportService
{
    public function __construct(
        private readonly CharacterRepository $characterRepository,
        private readonly ComboSequencesRepository $comboSequencesRepository,
        private readonly ConnectionTypeRepository $connectionTypeRepository,
        private readonly ComboSequenceCreationService $comboSequenceCreationService,
        private readonly ModerationTransitionService $moderationTransitionService,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * @param array<string, mixed> $document
     *
     * @return array{importedCount:int,skippedCount:int,results:list<array{id:string,status:string,comboId?:int,reason?:string}>}
     */
    public function import(array $document, User $actor): array
    {
        $combos = $this->validateDocument($document);
        $results = [];

        foreach ($combos as $index => $combo) {
            $results[] = $this->importOccurrence($combo, $index, $actor);
        }

        $importedCount = count(array_filter($results, static fn (array $result): bool => 'imported' === $result['status']));

        return [
            'importedCount' => $importedCount,
            'skippedCount' => count($results) - $importedCount,
            'results' => $results,
        ];
    }

    /**
     * @param array<string, mixed> $document
     *
     * @return list<array<string, mixed>>
     */
    private function validateDocument(array $document): array
    {
        if ('combo_export_v1' !== ($document['format'] ?? null)) {
            throw new BadRequestHttpException('Unsupported combo export format. Expected combo_export_v1.');
        }

        if (!is_array($document['source'] ?? null)) {
            throw new BadRequestHttpException('source must be an object.');
        }

        foreach (['replay_id', 'source_sha256', 'extractor_schema_version', 'analysis_format', 'analyzer_name', 'analyzer_version'] as $field) {
            if (!is_string($document['source'][$field] ?? null) || '' === trim($document['source'][$field])) {
                throw new BadRequestHttpException(sprintf('source.%s must be a non-empty string.', $field));
            }
        }

        if (!is_array($document['combos'] ?? null)) {
            throw new BadRequestHttpException('combos must be an array.');
        }

        foreach ($document['combos'] as $index => $combo) {
            if (!is_array($combo)) {
                throw new BadRequestHttpException(sprintf('combos[%d] must be an object.', $index));
            }
        }

        return array_values($document['combos']);
    }

    /**
     * @param array<string, mixed> $combo
     *
     * @return array{id:string,status:string,comboId?:int,reason?:string}
     */
    private function importOccurrence(array $combo, int $index, User $actor): array
    {
        $id = is_string($combo['id'] ?? null) && '' !== trim($combo['id'])
            ? $combo['id']
            : sprintf('combos[%d]', $index);

        if (true !== ($combo['ready_to_export'] ?? null)) {
            return $this->skipped($id, $this->blockedReason($combo));
        }

        try {
            $payload = $this->buildCreationPayload($combo);
            $sequence = $this->entityManager->wrapInTransaction(function () use ($payload, $actor): ComboSequences {
                $sequence = $this->comboSequenceCreationService->createFromPayload($payload, 'combo', $payload['steps'], $actor);
                $this->moderationTransitionService->submitComboForReview($sequence);
                $this->entityManager->flush();

                return $sequence;
            });
        } catch (\Throwable $exception) {
            return $this->skipped($id, $exception->getMessage());
        }

        return [
            'id' => $id,
            'status' => 'imported',
            'comboId' => $sequence->getId(),
        ];
    }

    /**
     * @param array<string, mixed> $combo
     *
     * @return array<string, mixed>
     */
    private function buildCreationPayload(array $combo): array
    {
        $characterName = $this->requireString($combo, 'character');
        $character = $this->characterRepository->findOneBy(['name' => $characterName]);
        if (!$character instanceof Character) {
            throw new \InvalidArgumentException(sprintf('Character "%s" is not available in the move catalog.', $characterName));
        }

        $sequence = $combo['sequence'] ?? null;
        if (!is_array($sequence) || [] === $sequence) {
            throw new \InvalidArgumentException('sequence must contain at least one supported step.');
        }

        $steps = $this->resolveSteps($sequence, $character);
        $notation = $this->requireString($combo, 'sequence_notation');
        $starterHitType = $combo['starter_hit_type'] ?? null;
        if (null !== $starterHitType && !in_array($starterHitType, ['counter_hit', 'punish_counter', 'normal'], true)) {
            throw new \InvalidArgumentException('starter_hit_type must be counter_hit, punish_counter, normal, or null.');
        }

        $damage = $combo['damage'] ?? null;
        if (!is_int($damage) || $damage < 0) {
            throw new \InvalidArgumentException('damage must be a non-negative integer.');
        }

        $requirements = match ($starterHitType) {
            'counter_hit' => ['counter_hit_required' => true],
            'punish_counter' => ['punish_counter_required' => true],
            default => [],
        };

        return [
            'name' => $this->comboName($notation, $starterHitType),
            'description' => 'Imported from a replay combo export.',
            'visibility' => 'public',
            'metrics' => ['damage' => $damage],
            'requirements' => $requirements,
            'steps' => $steps,
        ];
    }

    /**
     * @param list<mixed> $sourceSteps
     *
     * @return list<array{child_sequence_id:int,ordinal_in_combo:int,connection_type_id:int}>
     */
    private function resolveSteps(array $sourceSteps, Character $character): array
    {
        $connectionTypes = $this->connectionTypesByName();
        $resolvedSteps = [];
        $pendingDriveRushCancel = false;

        foreach ($sourceSteps as $index => $sourceStep) {
            if (!is_array($sourceStep)) {
                throw new \InvalidArgumentException(sprintf('sequence step %d must be an object.', $index + 1));
            }

            $kind = $this->requireString($sourceStep, 'kind');
            if ('drive_rush_cancel' === $kind) {
                if ([] === $resolvedSteps || $pendingDriveRushCancel) {
                    throw new \InvalidArgumentException('drive_rush_cancel must appear between resolved moves.');
                }
                $pendingDriveRushCancel = true;
                continue;
            }

            if ('unmapped' === $kind) {
                throw new \InvalidArgumentException('sequence contains an unmapped move.');
            }

            $notation = 'drive_rush' === $kind ? 'DR' : ($sourceStep['notation'] ?? null);
            if ('move' !== $kind || !is_string($notation) || '' === trim($notation)) {
                throw new \InvalidArgumentException(sprintf('Unsupported sequence step kind "%s".', $kind));
            }

            $leaf = $this->resolveLeaf($character, $notation);
            $leafId = $leaf->getId();
            if (null === $leafId) {
                throw new \InvalidArgumentException(sprintf('Leaf move "%s" has not been persisted.', $notation));
            }
            $connectionName = [] === $resolvedSteps
                ? 'initialmove'
                : ($pendingDriveRushCancel ? 'driverushcancel' : 'link');
            $connectionType = $connectionTypes[$connectionName] ?? null;
            if (!$connectionType instanceof ConnectionType || null === $connectionType->getId()) {
                throw new \InvalidArgumentException(sprintf('Required connection type "%s" is not configured.', $connectionName));
            }

            $resolvedSteps[] = [
                'child_sequence_id' => $leafId,
                'ordinal_in_combo' => count($resolvedSteps) + 1,
                'connection_type_id' => $connectionType->getId(),
            ];
            $pendingDriveRushCancel = false;
        }

        if ($pendingDriveRushCancel) {
            throw new \InvalidArgumentException('drive_rush_cancel must be followed by a move.');
        }

        return $resolvedSteps;
    }

    private function resolveLeaf(Character $character, string $notation): ComboSequences
    {
        $matches = array_values(array_filter(
            $this->comboSequencesRepository->findLeafsByCharacterId((string) $character->getId()),
            fn (ComboSequences $leaf): bool => $this->normalizeNotation($leaf->getMove()?->getNumpadNotation() ?? '') === $this->normalizeNotation($notation),
        ));

        if ([] === $matches) {
            throw new \InvalidArgumentException(sprintf('No leaf move matches notation "%s" for %s.', $notation, $character->getName()));
        }

        if (count($matches) > 1) {
            throw new \InvalidArgumentException(sprintf('Notation "%s" is ambiguous for %s.', $notation, $character->getName()));
        }

        return $matches[0];
    }

    /**
     * @return array<string, ConnectionType>
     */
    private function connectionTypesByName(): array
    {
        $types = [];
        foreach ($this->connectionTypeRepository->findAll() as $connectionType) {
            if ($connectionType instanceof ConnectionType) {
                $types[$this->normalizeConnectionName((string) $connectionType->getName())] = $connectionType;
            }
        }

        return $types;
    }

    /** @param array<string, mixed> $data */
    private function requireString(array $data, string $field): string
    {
        if (!is_string($data[$field] ?? null) || '' === trim($data[$field])) {
            throw new \InvalidArgumentException(sprintf('%s must be a non-empty string.', $field));
        }

        return trim($data[$field]);
    }

    /** @param array<string, mixed> $combo */
    private function blockedReason(array $combo): string
    {
        $blockers = $combo['export_blockers'] ?? [];
        if (is_array($blockers) && [] !== $blockers) {
            return sprintf('Export is blocked: %s.', implode(', ', array_filter($blockers, 'is_string')));
        }

        return 'Export is not ready.';
    }

    private function comboName(string $notation, ?string $starterHitType): string
    {
        $prefix = match ($starterHitType) {
            'counter_hit' => 'CH: ',
            'punish_counter' => 'PC: ',
            default => '',
        };

        return $prefix . $notation;
    }

    private function normalizeNotation(string $notation): string
    {
        return strtoupper((string) preg_replace('/\s+/', '', trim($notation)));
    }

    private function normalizeConnectionName(string $name): string
    {
        $normalized = strtolower($name);

        return (string) preg_replace('/[^a-z0-9]/', '', $normalized);
    }

    /**
     * @return array{id:string,status:string,reason:string}
     */
    private function skipped(string $id, string $reason): array
    {
        return ['id' => $id, 'status' => 'skipped', 'reason' => $reason];
    }
}
