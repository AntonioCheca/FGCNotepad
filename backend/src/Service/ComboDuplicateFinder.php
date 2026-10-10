<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ComboSequences;
use App\Repository\ComboSequencesRepository;
use App\Service\Modern\ComboExecutionProfileService;
use App\Util\Enum\ComboExecutionMode;

/**
 * Corner is deliberately not compared: the same combo seen in the corner and midscreen simply works in both.
 */
final class ComboDuplicateFinder
{
    public function __construct(
        private readonly ComboSequencesRepository $comboSequencesRepository,
        private readonly ComboExecutionProfileService $comboExecutionProfileService,
    ) {
    }

    /**
     * @param array<int, mixed> $stepsPayload
     * @param array<string, mixed> $requirements
     *
     * @return list<ComboSequences>
     */
    public function findSameMovesAndStarterConditions(array $stepsPayload, array $requirements): array
    {
        $steps = $this->stepKeys($stepsPayload);
        if (null === $steps) {
            return [];
        }

        $ids = $this->comboSequencesRepository->findIdsWithStepsAndStarterConditions(
            $steps,
            (bool) ($requirements['counter_hit_required'] ?? false),
            (bool) ($requirements['punish_counter_required'] ?? false),
            (bool) ($requirements['perfect_parry_required'] ?? false),
            (bool) ($requirements['blocked_drive_impact_stun_required'] ?? false),
        );

        return array_values(array_filter(array_map(fn (int $id): ?ComboSequences => $this->comboSequencesRepository->find($id), $ids)));
    }

    /**
     * Same moves, connections, starter conditions and damage, comparing the damage in the execution mode it was entered in.
     *
     * @param array<string, mixed> $payload a full combo creation payload
     */
    public function findExactDuplicate(array $payload): ?ComboSequences
    {
        $requirements = is_array($payload['requirements'] ?? null) ? $payload['requirements'] : [];
        $stepsPayload = is_array($payload['steps'] ?? null) ? $payload['steps'] : [];
        $damage = $this->damage($payload);
        $mode = $this->comboExecutionProfileService->knownDamageMode($payload);

        foreach ($this->findSameMovesAndStarterConditions($stepsPayload, $requirements) as $candidate) {
            if ($damage === $this->damageIn($candidate, $mode)) {
                return $candidate;
            }
        }

        return null;
    }

    /**
     * Malformed steps yield null so creation reports its own validation error instead.
     *
     * @param array<int, mixed> $stepsPayload
     *
     * @return list<array{leaf:int,connection:int}>|null
     */
    private function stepKeys(array $stepsPayload): ?array
    {
        $keyed = [];
        foreach ($stepsPayload as $step) {
            if (!is_array($step) || !is_int($step['child_sequence_id'] ?? null) || !is_int($step['ordinal_in_combo'] ?? null)) {
                return null;
            }
            $connection = $step['connection_type_id'] ?? null;
            if (null !== $connection && !is_int($connection)) {
                return null;
            }
            $keyed[$step['ordinal_in_combo']] = ['leaf' => $step['child_sequence_id'], 'connection' => $connection ?? 0];
        }
        ksort($keyed);

        return [] === $keyed ? null : array_values($keyed);
    }

    /** @param array<string, mixed> $payload */
    private function damage(array $payload): ?int
    {
        $metrics = is_array($payload['metrics'] ?? null) ? $payload['metrics'] : [];

        return empty($metrics['damage']) ? null : (int) $metrics['damage'];
    }

    private function damageIn(ComboSequences $combo, ComboExecutionMode $mode): ?int
    {
        $metrics = $combo->getComboMetrics();

        return match ($mode) {
            ComboExecutionMode::CLASSIC => $metrics?->getDamage(),
            ComboExecutionMode::MODERN_MAX => $metrics?->getModernMaxDamage(),
            ComboExecutionMode::MODERN_SIMPLE => $metrics?->getModernSimpleDamage(),
        };
    }
}
