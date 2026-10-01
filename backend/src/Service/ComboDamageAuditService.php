<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ComboSequences;
use App\Repository\ComboSequencesRepository;

/** Compares each combo's stored damage (observed or entered) against what the damage estimator computes for it. */
final class ComboDamageAuditService
{
    public const STATUS_MATCH = 'match';
    public const STATUS_MISMATCH = 'mismatch';
    public const STATUS_UNVERIFIABLE = 'unverifiable';
    public const STATUS_NOT_FOUND = 'not_found';

    public function __construct(
        private readonly ComboSequencesRepository $comboSequencesRepository,
        private readonly StoredComboDamageEstimator $storedComboDamageEstimator,
    ) {
    }

    /**
     * @param list<int> $comboIds
     *
     * @return array{checkedCount:int,matchCount:int,mismatchCount:int,unverifiableCount:int,notFoundCount:int,results:list<array<string, mixed>>}
     */
    public function audit(array $comboIds): array
    {
        $comboIds = array_values(array_unique($comboIds));
        $combosById = [];
        foreach ($this->comboSequencesRepository->findBy(['id' => $comboIds]) as $combo) {
            $combosById[(int) $combo->getId()] = $combo;
        }

        $results = [];
        foreach ($comboIds as $comboId) {
            $results[] = isset($combosById[$comboId])
                ? $this->auditCombo($combosById[$comboId])
                : ['comboId' => $comboId, 'status' => self::STATUS_NOT_FOUND];
        }
        $statusCounts = array_count_values(array_column($results, 'status'));

        return [
            'checkedCount' => count($results),
            'matchCount' => $statusCounts[self::STATUS_MATCH] ?? 0,
            'mismatchCount' => $statusCounts[self::STATUS_MISMATCH] ?? 0,
            'unverifiableCount' => $statusCounts[self::STATUS_UNVERIFIABLE] ?? 0,
            'notFoundCount' => $statusCounts[self::STATUS_NOT_FOUND] ?? 0,
            'results' => $results,
        ];
    }

    /** @return array<string, mixed> */
    private function auditCombo(ComboSequences $combo): array
    {
        $estimation = $this->storedComboDamageEstimator->estimate($combo);
        $storedDamage = $combo->getComboMetrics()?->getDamage();
        $unestimatedSteps = array_values(array_filter($estimation['steps'], static fn (array $step): bool => null === $step['estimatedDamage']));
        $warnings = $estimation['warnings'];
        if (null === $storedDamage) {
            $warnings[] = 'The combo has no stored damage.';
        }
        if ([] === $estimation['steps']) {
            $warnings[] = 'The combo has no steps.';
        }
        foreach ($unestimatedSteps as $step) {
            $warnings[] = sprintf('Step "%s" has no frame-data damage and was left out of the estimate.', $step['notation'] ?? 'unknown move');
        }

        $verifiable = null !== $storedDamage && [] !== $estimation['steps'] && [] === $unestimatedSteps;
        $difference = null === $storedDamage ? null : $estimation['estimatedDamage'] - $storedDamage;

        return [
            'comboId' => (int) $combo->getId(),
            'status' => match (true) {
                !$verifiable => self::STATUS_UNVERIFIABLE,
                0 === $difference => self::STATUS_MATCH,
                default => self::STATUS_MISMATCH,
            },
            'name' => $combo->getName(),
            'character' => $combo->getCharacter()?->getName(),
            'notation' => implode(' > ', array_map(static fn (array $step): string => $step['notation'] ?? '?', $estimation['steps'])),
            'starter' => $this->starter($combo),
            'storedDamage' => $storedDamage,
            'estimatedDamage' => $estimation['estimatedDamage'],
            'difference' => $difference,
            'steps' => $estimation['steps'],
            'warnings' => array_values(array_unique($warnings)),
        ];
    }

    private function starter(ComboSequences $combo): string
    {
        $requirement = $combo->getComboRequirement();

        return match (true) {
            true === $requirement?->isPerfectParryRequired() => 'perfect_parry',
            true === $requirement?->isBlockedDriveImpactStunRequired() => 'blocked_drive_impact_stun',
            true === $requirement?->isPunishCounterRequired() => 'punish_counter',
            true === $requirement?->isCounterHitRequired() => 'counter_hit',
            default => 'normal',
        };
    }
}
