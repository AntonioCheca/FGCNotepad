<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Character;
use App\Entity\Move;
use App\Entity\OkiNode;
use App\Entity\OkiNodeLink;
use App\Entity\OkiProfile;
use App\Entity\OkiSetup;
use App\Entity\Replay;
use App\Entity\User;
use App\Util\MoveNotationAliases;
use App\Util\ReplayMoveNotation;
use App\Repository\CharacterRepository;
use App\Repository\MoveRepository;
use App\Repository\OkiProfileRepository;
use App\Util\Enum\OkiStepType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * Imports the attacker side of oki_export_v1 occurrences as OkiSetups under the ender's OkiProfile.
 * Created setups enter the moderation queue as pending. Defender actions are ignored: OkiOptionInteraction needs a result and defensive move replays do not provide.
 */
final class ReplayOkiImportService
{
    public function __construct(
        private readonly CharacterRepository $characterRepository,
        private readonly MoveRepository $moveRepository,
        private readonly OkiProfileRepository $okiProfileRepository,
        private readonly ModerationTransitionService $moderationTransitionService,
        private readonly ReplayContextImportService $replayContextImportService,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * Accepts a single oki_export_v1 document or an oki_export_bundle_v1 wrapping many of them.
     *
     * @param array<string, mixed> $document
     *
     * @return array<string, mixed>
     */
    public function import(array $document, User $actor): array
    {
        if ('oki_export_bundle_v1' === ($document['format'] ?? null)) {
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
        $okis = $this->validateDocument($document);
        $replay = $this->replayContextImportService->upsert($document);
        $results = [];
        foreach ($okis as $index => $oki) {
            $results[] = $this->importOccurrence($oki, $index, $actor, $replay);
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
        if ('oki_export_v1' !== ($document['format'] ?? null)) {
            throw new BadRequestHttpException('Unsupported Oki export format. Expected oki_export_v1.');
        }

        if (!is_array($document['source'] ?? null)) {
            throw new BadRequestHttpException('source must be an object.');
        }

        foreach (['replay_id', 'source_sha256'] as $field) {
            if (!is_string($document['source'][$field] ?? null) || '' === trim($document['source'][$field])) {
                throw new BadRequestHttpException(sprintf('source.%s must be a non-empty string.', $field));
            }
        }

        if (!is_array($document['okis'] ?? null)) {
            throw new BadRequestHttpException('okis must be an array.');
        }

        foreach ($document['okis'] as $index => $oki) {
            if (!is_array($oki)) {
                throw new BadRequestHttpException(sprintf('okis[%d] must be an object.', $index));
            }
        }

        return array_values($document['okis']);
    }

    /**
     * @param array<string, mixed> $oki
     *
     * @return array<string, mixed>
     */
    private function importOccurrence(array $oki, int $index, User $actor, Replay $replay): array
    {
        $id = is_string($oki['id'] ?? null) && '' !== trim($oki['id']) ? $oki['id'] : sprintf('okis[%d]', $index);

        if (true !== ($oki['ready_to_export'] ?? null)) {
            return $this->skipped($id, $this->blockedReason($oki));
        }

        if ($this->replayContextImportService->hasOkiObservation($replay, $id)) {
            return $this->skipped($id, 'Already recorded for this replay.');
        }

        // No wrapInTransaction: it closes the EntityManager when a callback throws, which would break every later
        // occurrence. Validation happens before anything is persisted, and the single flush is atomic.
        try {
            [$setup, $isNew] = $this->buildSetup($oki, $actor);
            $this->replayContextImportService->recordOkiObservation(
                $replay,
                $setup,
                $id,
                is_array($oki['attacker'] ?? null) ? ($oki['attacker']['player_slot'] ?? null) : null,
                is_array($oki['defender'] ?? null) ? ($oki['defender']['player_slot'] ?? null) : null,
            );
            $this->entityManager->flush();
        } catch (\Throwable $exception) {
            return $this->skipped($id, $exception->getMessage());
        }

        return ['id' => $id, 'status' => $isNew ? 'imported' : 'observed', 'profileId' => $setup->getProfile()->getId(), 'setupId' => $setup->getId()];
    }

    /**
     * @param array<string, mixed> $oki
     *
     * @return array{0: OkiSetup, 1: bool} the setup and whether it was newly created (false: an identical setup already existed)
     */
    private function buildSetup(array $oki, User $actor): array
    {
        $attackerName = $this->requireString(is_array($oki['attacker'] ?? null) ? $oki['attacker'] : [], 'character');
        $attacker = $this->characterRepository->findOneByExportName($attackerName);
        if (!$attacker instanceof Character) {
            throw new \InvalidArgumentException(sprintf('Character "%s" is not available in the move catalog.', $attackerName));
        }

        $movesByNotation = $this->movesByNotation($attacker);
        $ender = is_array($oki['ender'] ?? null) ? $oki['ender'] : [];
        $enderMove = $this->resolveMove($movesByNotation, $ender['notation'] ?? null, $attacker);

        $moveNodes = [];
        $usesDriveRush = false;
        $enderSkipped = false;
        foreach (is_array($oki['attacker_actions'] ?? null) ? $oki['attacker_actions'] : [] as $action) {
            if (!is_array($action)) {
                continue;
            }
            if ('drive_rush' === ($action['kind'] ?? null)) {
                $usesDriveRush = true;
                continue;
            }
            if ('move' !== ($action['kind'] ?? null)) {
                continue;
            }
            if (!$enderSkipped && ($action['action_id'] ?? null) === ($ender['action_id'] ?? false)) {
                $enderSkipped = true;
                continue;
            }
            $moveNodes[] = $this->resolveMove($movesByNotation, $action['notation'] ?? null, $attacker);
        }

        if ([] === $moveNodes) {
            throw new \InvalidArgumentException('No attacker follow-up moves were observed.');
        }

        $moveIds = array_map(static fn (Move $move): string => (string) $move->getId(), $moveNodes);
        $profile = $this->okiProfileRepository->findOneBy(['move' => $enderMove]);
        if ($profile instanceof OkiProfile) {
            foreach ($profile->getSetups() as $existing) {
                if ($this->nodeMoveIds($existing) === $moveIds) {
                    return [$existing, false];
                }
            }
        } else {
            $profile = (new OkiProfile())
                ->setMove($enderMove)
                ->setFrameAdvantage($enderMove->getFrameData()?->getOnHit());
            $this->entityManager->persist($profile);
        }

        $recovery = is_array($oki['recovery'] ?? null) ? ($oki['recovery']['type'] ?? null) : null;
        $setup = (new OkiSetup())
            ->setUsesDriveRush($usesDriveRush)
            ->setWorksBackroll('backroll' === $recovery)
            ->setWorksNoBackroll('no_backroll' === $recovery)
            ->setAuthor($actor);
        $this->moderationTransitionService->submitOkiSetupForReview($setup);

        $previous = null;
        foreach ($moveNodes as $position => $move) {
            $node = (new OkiNode())->setMove($move)->setSortOrder($position)->setDefaultRoute(false);
            $setup->addNode($node);
            $previous?->addOutgoingLink(
                (new OkiNodeLink())->setToNode($node)->setStepType(OkiStepType::IMMEDIATE->value)
            );
            $previous = $node;
        }

        $profile->addSetup($setup);

        return [$setup, true];
    }

    /** @return list<string> */
    private function nodeMoveIds(OkiSetup $setup): array
    {
        $nodes = $setup->getNodes()->toArray();
        usort($nodes, static fn (OkiNode $a, OkiNode $b): int => $a->getSortOrder() <=> $b->getSortOrder());

        return array_map(static fn (OkiNode $node): string => (string) $node->getMove()->getId(), $nodes);
    }

    /** @return array<string, list<Move>> */
    private function movesByNotation(Character $character): array
    {
        $moves = [];
        foreach ($this->moveRepository->findByCharacterWithEffectiveFrameData((string) $character->getId()) as $move) {
            foreach ([$move->getNumpadNotation(), ...MoveNotationAliases::alternatives($move->getNumpadNotation())] as $alias) {
                $moves[ReplayMoveNotation::key($alias)][] = $move;
            }
        }

        return $moves;
    }

    /** @param array<string, list<Move>> $movesByNotation */
    private function resolveMove(array $movesByNotation, mixed $notation, Character $character): Move
    {
        if (!is_string($notation) || '' === trim($notation)) {
            throw new \InvalidArgumentException('A move step has no notation.');
        }

        $key = ReplayMoveNotation::key($notation);
        $matches = $movesByNotation[$key] ?? [];
        if ([] === $matches && null !== ($jumpKey = ReplayMoveNotation::jumpAliasKey($key))) {
            $matches = $movesByNotation[$jumpKey] ?? [];
        }
        if ([] === $matches && ReplayMoveNotation::isStrengthAgnostic($key)) {
            throw new \InvalidArgumentException(sprintf('Notation "%s" does not say which strength was used, so it cannot be matched to one %s move.', $notation, $character->getName()));
        }
        if ([] === $matches) {
            throw new \InvalidArgumentException(sprintf('No move matches notation "%s" for %s.', $notation, $character->getName()));
        }
        if (count($matches) > 1) {
            throw new \InvalidArgumentException(sprintf('Notation "%s" is ambiguous for %s.', $notation, $character->getName()));
        }

        return $matches[0];
    }

    /** @param array<string, mixed> $data */
    private function requireString(array $data, string $field): string
    {
        if (!is_string($data[$field] ?? null) || '' === trim($data[$field])) {
            throw new \InvalidArgumentException(sprintf('%s must be a non-empty string.', $field));
        }

        return trim($data[$field]);
    }

    /** @param array<string, mixed> $oki */
    private function blockedReason(array $oki): string
    {
        $blockers = $oki['export_blockers'] ?? [];
        if (is_array($blockers) && [] !== $blockers) {
            return sprintf('Export is blocked: %s.', implode(', ', array_filter($blockers, 'is_string')));
        }

        return 'Export is not ready.';
    }

    /** @return array{id:string,status:string,reason:string} */
    private function skipped(string $id, string $reason): array
    {
        return ['id' => $id, 'status' => 'skipped', 'reason' => $reason];
    }
}
