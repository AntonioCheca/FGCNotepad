<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Character;
use App\Entity\ComboSequences;
use App\Entity\Replay;
use App\Entity\User;
use App\Repository\CharacterRepository;
use App\Repository\ComboSequencesRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class ReplayComboImportService
{
    public function __construct(
        private readonly CharacterRepository $characterRepository,
        private readonly ComboSequencesRepository $comboSequencesRepository,
        private readonly ReplayComboStepResolver $stepResolver,
        private readonly ComboSequenceCreationService $comboSequenceCreationService,
        private readonly ModerationTransitionService $moderationTransitionService,
        private readonly ReplayContextImportService $replayContextImportService,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * Accepts a single combo_export_v1 document or a combo_export_bundle_v1 wrapping many of them.
     *
     * @param array<string, mixed> $document
     *
     * @return array<string, mixed>
     */
    public function import(array $document, User $actor): array
    {
        if ('combo_export_bundle_v1' === ($document['format'] ?? null)) {
            return $this->importBundle($document, $actor);
        }

        return $this->importDocument($document, $actor);
    }

    /**
     * @param array<string, mixed> $bundle
     *
     * @return array<string, mixed>
     */
    private function importBundle(array $bundle, User $actor): array
    {
        if (!is_array($bundle['documents'] ?? null) || !array_is_list($bundle['documents'])) {
            throw new BadRequestHttpException('documents must be an array.');
        }

        $documents = [];
        $actorId = $actor->getId();
        foreach ($bundle['documents'] as $index => $document) {
            $replayId = is_array($document) && is_array($document['source'] ?? null) && is_string($document['source']['replay_id'] ?? null)
                ? $document['source']['replay_id']
                : sprintf('documents[%d]', $index);

            try {
                if (!is_array($document)) {
                    throw new BadRequestHttpException('Document must be an object.');
                }
                $documents[] = ['replayId' => $replayId] + $this->importDocument($document, $actor);
            } catch (BadRequestHttpException $exception) {
                $documents[] = ['replayId' => $replayId, 'importedCount' => 0, 'observedCount' => 0, 'skippedCount' => 0, 'results' => [], 'error' => $exception->getMessage()];
            } finally {
                // A bundle can contain hundreds of combos. Keep only one document's ORM graph managed.
                $this->entityManager->clear();
                $this->stepResolver->clearCache();
                $this->replayContextImportService->clearCache();
                $actor = $this->entityManager->getReference(User::class, $actorId);
            }
        }

        return [
            'importedCount' => array_sum(array_column($documents, 'importedCount')),
            'observedCount' => array_sum(array_column($documents, 'observedCount')),
            'skippedCount' => array_sum(array_column($documents, 'skippedCount')),
            'results' => [],
            'documents' => $documents,
        ];
    }

    /**
     * @param array<string, mixed> $document
     *
     * @return array<string, mixed>
     */
    private function importDocument(array $document, User $actor): array
    {
        $combos = $this->validateDocument($document);
        $replay = $this->replayContextImportService->upsert($document);
        $results = [];

        foreach ($combos as $index => $combo) {
            $results[] = $this->importOccurrence($combo, $index, $actor, $replay);
        }

        $importedCount = count(array_filter($results, static fn (array $result): bool => 'imported' === $result['status']));
        $observedCount = count(array_filter($results, static fn (array $result): bool => 'observed' === $result['status']));

        return [
            'importedCount' => $importedCount,
            'observedCount' => $observedCount,
            'skippedCount' => count($results) - $importedCount - $observedCount,
            'replay' => $this->replayContextImportService->summarize($replay),
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
    private function importOccurrence(array $combo, int $index, User $actor, Replay $replay): array
    {
        $id = is_string($combo['id'] ?? null) && '' !== trim($combo['id'])
            ? $combo['id']
            : sprintf('combos[%d]', $index);

        if (true !== ($combo['ready_to_export'] ?? null)) {
            return $this->skipped($id, $this->blockedReason($combo));
        }

        if ($this->replayContextImportService->hasComboObservation($replay, $id)) {
            return $this->skipped($id, 'Already recorded for this replay.');
        }

        try {
            $payload = $this->buildCreationPayload($combo, $replay->getExtractorReplayId(), $id);
            $knownId = $this->comboSequencesRepository->findIdWithSteps(array_map(
                static fn (array $step): array => ['leaf' => $step['child_sequence_id'], 'connection' => $step['connection_type_id']],
                $payload['steps'],
            ));
            $status = 'imported';
            $sequence = $this->entityManager->wrapInTransaction(function () use ($payload, $actor, $knownId, $combo, $id, $replay, &$status): ComboSequences {
                if (null !== $knownId) {
                    $status = 'observed';
                    $sequence = $this->comboSequencesRepository->find($knownId);
                    if (!$sequence instanceof ComboSequences) {
                        throw new \RuntimeException('Existing combo disappeared during import.');
                    }
                } else {
                    $sequence = $this->comboSequenceCreationService->createFromPayload(
                        $payload,
                        'combo',
                        $payload['steps'],
                        $actor,
                        false,
                    );
                    $this->moderationTransitionService->submitComboForReview($sequence);
                }
                $this->replayContextImportService->recordComboObservation($replay, $sequence, $id, $combo);
                $this->entityManager->flush();

                return $sequence;
            });
        } catch (\Throwable $exception) {
            return $this->skipped($id, $exception->getMessage());
        }

        return [
            'id' => $id,
            'status' => $status,
            'comboId' => $sequence->getId(),
        ];
    }

    /**
     * @param array<string, mixed> $combo
     *
     * @return array<string, mixed>
     */
    private function buildCreationPayload(array $combo, string $replayId, string $occurrenceId): array
    {
        $characterName = $this->requireString($combo, 'character');
        $character = $this->characterRepository->findOneByExportName($characterName);
        if (!$character instanceof Character) {
            throw new \InvalidArgumentException(sprintf('Character "%s" is not available in the move catalog.', $characterName));
        }

        $sequence = $combo['sequence'] ?? null;
        if (!is_array($sequence) || [] === $sequence) {
            throw new \InvalidArgumentException('sequence must contain at least one supported step.');
        }

        $resolution = $this->stepResolver->resolve($sequence, $character);
        $steps = $resolution['steps'];
        $notation = $resolution['notation'];
        $starterHitType = $combo['starter_hit_type'] ?? null;
        if (null !== $starterHitType && !in_array($starterHitType, ['counter_hit', 'punish_counter', 'normal'], true)) {
            throw new \InvalidArgumentException('starter_hit_type must be counter_hit, punish_counter, normal, or null.');
        }

        $damage = $combo['damage'] ?? null;
        if (!is_int($damage) || $damage < 0) {
            throw new \InvalidArgumentException('damage must be a non-negative integer.');
        }

        $perfectParry = $this->starterPerfectParry($combo);
        if ($perfectParry && 'punish_counter' !== $starterHitType) {
            throw new \InvalidArgumentException('starter_defense.perfect_parry requires a punish_counter starter.');
        }

        $requirements = match ($starterHitType) {
            'counter_hit' => ['counter_hit_required' => true],
            'punish_counter' => ['punish_counter_required' => true],
            default => [],
        };
        if ($perfectParry) {
            $requirements['perfect_parry_required'] = true;
        }

        return [
            'name' => $this->comboName($notation, $starterHitType, $perfectParry, $replayId, $occurrenceId, $combo['start_round_timer'] ?? null),
            'description' => trim('Imported from a replay combo export. ' . implode(' ', $resolution['notes'])),
            'visibility' => 'public',
            'metrics' => ['damage' => $damage],
            'requirements' => $requirements,
            'steps' => $steps,
        ];
    }

    /**
     * Pre-0.28 exports carry no starter_defense, or perfect_parry: null; both mean no Perfect Parry evidence.
     *
     * @param array<string, mixed> $combo
     */
    private function starterPerfectParry(array $combo): bool
    {
        $starterDefense = $combo['starter_defense'] ?? [];
        $perfectParry = is_array($starterDefense) ? ($starterDefense['perfect_parry'] ?? null) : false;
        if (!is_array($starterDefense) || (null !== $perfectParry && !is_bool($perfectParry))) {
            throw new \InvalidArgumentException('starter_defense.perfect_parry must be a boolean or null.');
        }

        return true === $perfectParry;
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

    /** The trailing tag lets a reviewer find the occurrence in its replay: replay id, occurrence id (round, slot, number) and, when exported, the round timer at combo start. */
    private function comboName(string $notation, ?string $starterHitType, bool $perfectParry, string $replayId, string $occurrenceId, mixed $startRoundTimer): string
    {
        $prefix = match (true) {
            $perfectParry => 'PP+PC: ',
            'counter_hit' === $starterHitType => 'CH: ',
            'punish_counter' === $starterHitType => 'PC: ',
            default => '',
        };
        $tag = [
            $this->identifierForName($replayId),
            $this->identifierForName($occurrenceId),
        ];
        if (is_int($startRoundTimer) && $startRoundTimer >= 0 && $startRoundTimer <= 999) {
            $tag[] = 't' . $startRoundTimer;
        }

        return sprintf('%s%s [%s]', $prefix, $notation, implode(' ', array_filter($tag, static fn (string $part): bool => '' !== $part)));
    }

    /** Replay and occurrence ids come from the export; only plain identifier characters reach the combo name. */
    private function identifierForName(string $value): string
    {
        return substr((string) preg_replace('/[^A-Za-z0-9_.:-]/', '', $value), 0, 64);
    }

    /**
     * @return array{id:string,status:string,reason:string}
     */
    private function skipped(string $id, string $reason): array
    {
        return ['id' => $id, 'status' => 'skipped', 'reason' => $reason];
    }
}
