<?php declare(strict_types=1);

namespace App\Service\ReportBundle;

use App\Entity\CharacterObject;
use App\Entity\CharacterObjectState;
use App\Entity\ComboMetrics;
use App\Entity\ComboRequirement;
use App\Entity\ComboSequences;
use App\Entity\Move;
use App\Entity\Step;
use App\Repository\CharacterObjectRepository;
use App\Repository\CharacterRepository;
use App\Repository\ConnectionTypeRepository;
use App\Repository\MoveRepository;

/**
 * Writes a stored combo as database-independent data (moves by character and notation, connections by name, resources
 * by key) and turns that back into a creation payload for the local database. Replay tags and importer notes are
 * dropped on the way out, so a bundle never carries replay identifiers.
 */
class ReportBundleComboCodec
{
    private const REPLAY_TAG = '/\s*\[[A-Za-z0-9_.:-]+ [^\]]*\]$/';
    private const IMPORTER_DESCRIPTION_PREFIX = 'Imported from a replay combo export.';
    private const REQUIREMENT_FLAGS = [
        'counter_hit_required',
        'punish_counter_required',
        'perfect_parry_required',
        'blocked_drive_impact_stun_required',
        'corner_required',
        'airborne_required',
        'not_crouching_required',
        'side_switches_required',
    ];
    private const METRIC_FIELDS = ['driveCost', 'driveGain', 'minimumDriveCost', 'minimumDriveCostNoBurnout', 'superCost', 'superGain'];

    public function __construct(
        private readonly CharacterRepository $characterRepository,
        private readonly MoveRepository $moveRepository,
        private readonly ConnectionTypeRepository $connectionTypeRepository,
        private readonly CharacterObjectRepository $characterObjectRepository,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function export(ComboSequences $combo): array
    {
        $description = trim((string) $combo->getDescription());
        $entry = [
            'name' => self::cleanName((string) $combo->getName()),
            'description' => str_starts_with($description, self::IMPORTER_DESCRIPTION_PREFIX) ? '' : $description,
            'inputNotation' => $combo->getInputNotation(),
            'isEssential' => $combo->isEssential(),
            'spacing' => $combo->getSpacing()?->getCode(),
            'metrics' => $this->exportMetrics($combo->getComboMetrics()),
            'requirements' => $this->exportRequirements($combo->getComboRequirement()),
            'steps' => array_map(fn (Step $step): array => $this->exportStep($step), $this->orderedSteps($combo)),
        ];

        return array_filter($entry, static fn (mixed $value): bool => null !== $value && [] !== $value && '' !== $value);
    }

    public static function cleanName(string $name): string
    {
        return trim((string) preg_replace(self::REPLAY_TAG, '', $name));
    }

    /**
     * @param array<string, mixed> $entry
     *
     * @return array<string, mixed> a payload for ComboSequenceCreationService
     *
     * @throws \InvalidArgumentException naming the field that does not resolve in this database
     */
    public function toCreationPayload(array $entry): array
    {
        $steps = $entry['steps'] ?? null;
        if (!is_array($steps) || [] === $steps) {
            throw new \InvalidArgumentException('steps must be a non-empty list.');
        }

        $damage = $entry['metrics']['damage'] ?? null;
        if (!is_int($damage) || $damage <= 0) {
            throw new \InvalidArgumentException('metrics.damage must be a positive integer.');
        }

        $payload = [
            'name' => self::cleanName((string) ($entry['name'] ?? '')),
            'description' => (string) ($entry['description'] ?? ''),
            'visibility' => 'public',
            'metrics' => array_intersect_key($entry['metrics'], array_flip(['damage', ...self::METRIC_FIELDS])),
            'requirements' => is_array($entry['requirements'] ?? null) ? $entry['requirements'] : [],
            'steps' => array_map(fn (mixed $step, int $index): array => $this->stepPayload($step, $index), array_values($steps), array_keys(array_values($steps))),
        ];
        if (is_string($entry['inputNotation'] ?? null)) {
            $payload['inputNotation'] = $entry['inputNotation'];
        }
        if (is_string($entry['spacing'] ?? null)) {
            $payload['spacingCode'] = $entry['spacing'];
        }

        return $payload;
    }

    /**
     * @return array<string, float|int>|null
     */
    private function exportMetrics(?ComboMetrics $metrics): ?array
    {
        if (!$metrics instanceof ComboMetrics) {
            return null;
        }

        $values = ['damage' => $metrics->getDamage()];
        foreach (self::METRIC_FIELDS as $field) {
            $values[$field] = $metrics->{'get' . ucfirst($field)}();
        }

        return array_filter($values, static fn (mixed $value): bool => null !== $value);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function exportRequirements(?ComboRequirement $requirement): ?array
    {
        if (!$requirement instanceof ComboRequirement) {
            return null;
        }

        $values = [
            'counter_hit_required' => (bool) $requirement->isCounterHitRequired(),
            'punish_counter_required' => (bool) $requirement->isPunishCounterRequired(),
            'perfect_parry_required' => $requirement->isPerfectParryRequired(),
            'blocked_drive_impact_stun_required' => $requirement->isBlockedDriveImpactStunRequired(),
            'corner_required' => (bool) $requirement->isCornerRequired(),
            'airborne_required' => (bool) $requirement->isAirborneRequired(),
            'not_crouching_required' => (bool) $requirement->isNotCrouchingRequired(),
            'side_switches_required' => $requirement->isSideSwitchesRequired(),
            'initial_opponent_posture' => $requirement->getInitialOpponentPosture(),
            'initial_opponent_ground_state' => $requirement->getInitialOpponentGroundState(),
            'initial_juggle_altitude' => $requirement->getInitialJuggleAltitude(),
            'combo_object_states' => array_map(
                static fn (CharacterObjectState $state): array => array_filter([
                    'object_key' => $state->getObjectKey(),
                    'status_required' => $state->getStatusRequired(),
                    'consumed' => $state->isConsumed() ?: null,
                    'added_relative' => $state->getAddedRelative(),
                    'added_absolute' => $state->getAddedAbsolute(),
                ], static fn (mixed $value): bool => null !== $value),
                $requirement->getCharacterObjectStates()->toArray(),
            ),
        ];

        return array_filter(
            $values,
            static fn (mixed $value, string $key): bool => in_array($key, self::REQUIREMENT_FLAGS, true) ? true === $value : null !== $value && [] !== $value,
            ARRAY_FILTER_USE_BOTH,
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function exportStep(Step $step): array
    {
        $move = $step->getChildSequence()?->getMove();
        if (!$move instanceof Move) {
            throw new \InvalidArgumentException('Only combos built from single-move steps can be exported.');
        }

        $entry = [
            'character' => $move->getCharacter()->getName(),
            'move' => $move->getNumpadNotation(),
            'connection' => $step->getConnectionType()?->getName(),
        ];
        if (null !== $step->getDelayMinFrames() || null !== $step->getDelayMaxFrames() || $step->isDelayMinUnverified() || $step->isDelayMaxUnverified()) {
            $entry['delay'] = [
                'min' => $step->getDelayMinFrames(),
                'max' => $step->getDelayMaxFrames(),
                'minUnverified' => $step->isDelayMinUnverified(),
                'maxUnverified' => $step->isDelayMaxUnverified(),
            ];
        }
        if ($step->getResourceObject() instanceof CharacterObject) {
            $entry['resource'] = ['object' => $step->getResourceObject()->getObjectKey(), 'delta' => $step->getResourceDelta()];
        }

        return array_filter($entry, static fn (mixed $value): bool => null !== $value);
    }

    /**
     * @return array<string, mixed>
     */
    private function stepPayload(mixed $step, int $index): array
    {
        $path = sprintf('steps[%d]', $index);
        if (!is_array($step) || !is_string($step['character'] ?? null) || !is_string($step['move'] ?? null)) {
            throw new \InvalidArgumentException(sprintf('%s needs character and move.', $path));
        }

        $character = $this->characterRepository->findOneByExportName($step['character']);
        $move = null === $character ? null : $this->moveRepository->findOneBy(['character' => $character, 'numpadNotation' => $step['move']]);
        $leaf = $move?->getComboSequence();
        if (!$leaf instanceof ComboSequences) {
            throw new \InvalidArgumentException(sprintf('%s: %s %s is not in this move catalog.', $path, $step['character'], $step['move']));
        }

        $payload = ['child_sequence_id' => $leaf->getId(), 'ordinal_in_combo' => $index + 1];
        if (is_string($step['connection'] ?? null)) {
            $connection = $this->connectionTypeRepository->findOneBy(['name' => $step['connection']]);
            if (null === $connection) {
                throw new \InvalidArgumentException(sprintf('%s: connection "%s" does not exist.', $path, $step['connection']));
            }
            $payload['connection_type_id'] = $connection->getId();
        }
        if (is_array($step['delay'] ?? null)) {
            $payload += [
                'delay_min_frames' => $step['delay']['min'] ?? null,
                'delay_max_frames' => $step['delay']['max'] ?? null,
                'delay_min_unverified' => (bool) ($step['delay']['minUnverified'] ?? false),
                'delay_max_unverified' => (bool) ($step['delay']['maxUnverified'] ?? false),
            ];
        }
        if (is_array($step['resource'] ?? null)) {
            $resource = is_string($step['resource']['object'] ?? null) ? $this->characterObjectRepository->findOneByKey($step['resource']['object']) : null;
            if (!$resource instanceof CharacterObject) {
                throw new \InvalidArgumentException(sprintf('%s: resource "%s" does not exist.', $path, (string) ($step['resource']['object'] ?? '')));
            }
            $payload['resource_object_id'] = $resource->getId();
            $payload['resource_delta'] = $step['resource']['delta'] ?? null;
        }

        return $payload;
    }

    /**
     * @return list<Step>
     */
    private function orderedSteps(ComboSequences $combo): array
    {
        $steps = $combo->getSteps()->toArray();
        usort($steps, static fn (Step $left, Step $right): int => $left->getOrdinalInCombo() <=> $right->getOrdinalInCombo());

        return $steps;
    }
}
