<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ComboSequences;
use App\Entity\Move;
use App\Repository\ComboSequencesRepository;
use App\Repository\MoveManualMetadataRepository;

class ComboCrouchRequirementInferenceService
{
    public function __construct(
        private readonly ComboSequencesRepository $comboSequencesRepository,
        private readonly MoveManualMetadataRepository $moveManualMetadataRepository,
    ) {
    }

    /**
     * @param list<array<string, mixed>> $steps
     */
    public function requiresOpponentNotCrouching(array $steps): bool
    {
        $leafIds = [];
        foreach ($steps as $step) {
            $leafId = isset($step['child_sequence_id']) ? (int) $step['child_sequence_id'] : 0;
            if ($leafId > 0) {
                $leafIds[] = $leafId;
            }
        }

        if ([] === $leafIds) {
            return false;
        }

        $leafSequences = $this->comboSequencesRepository->findBy(['id' => array_values(array_unique($leafIds))]);
        $moveByLeafId = [];
        $moves = [];
        foreach ($leafSequences as $leafSequence) {
            if (!$leafSequence instanceof ComboSequences || null === $leafSequence->getId()) {
                continue;
            }

            $move = $leafSequence->getMove();
            if (!$move instanceof Move) {
                continue;
            }

            $moveByLeafId[(int) $leafSequence->getId()] = $move;
            $moves[] = $move;
        }

        $metadataMap = $this->moveManualMetadataRepository->findMapForMoves($moves);
        $hasForcedStandingBefore = false;

        foreach ($leafIds as $leafId) {
            $move = $moveByLeafId[$leafId] ?? null;
            if (!$move instanceof Move || null === $move->getId()) {
                continue;
            }

            $metadata = $metadataMap[$move->getId()->toRfc4122()] ?? null;
            if (null !== $metadata && $metadata->whiffsOnCrouch() && !$hasForcedStandingBefore) {
                return true;
            }

            if (null !== $metadata && $metadata->forcesStanding()) {
                $hasForcedStandingBefore = true;
            }
        }

        return false;
    }
}
