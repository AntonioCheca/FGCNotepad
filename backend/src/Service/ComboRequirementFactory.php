<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ComboRequirement;
use App\Entity\ComboSequences;
use App\Entity\CharacterObjectState;
use InvalidArgumentException;

class ComboRequirementFactory
{
    public function __construct(
        ?CharacterObjectCatalog $catalog = null,
    ) {
        $this->catalog = $catalog ?? new CharacterObjectCatalog();
    }

    private CharacterObjectCatalog $catalog;

    /** @param array<string, mixed> $requirements */
    public function createFromPayload(ComboSequences $sequence, array $requirements): ?ComboRequirement
    {
        $counterHitRequired = (bool) ($requirements['counter_hit_required'] ?? false);
        $punishCounterRequired = (bool) ($requirements['punish_counter_required'] ?? false);
        $cornerRequired = (bool) ($requirements['corner_required'] ?? false);
        $airborneRequired = (bool) ($requirements['airborne_required'] ?? false);
        $notCrouchingRequired = (bool) ($requirements['not_crouching_required'] ?? false);
        $sideSwitchesRequired = (bool) ($requirements['side_switches_required'] ?? false);

        $objectStatePayloads = $this->objectStatePayloads($requirements);

        if ($counterHitRequired && $punishCounterRequired) {
            throw new InvalidArgumentException('counter_hit_required and punish_counter_required cannot both be true.');
        }

        $objectStates = array_map(fn (array $payload): CharacterObjectState => $this->buildObjectState($payload, $sequence), $objectStatePayloads);
        $hasObjectStates = [] !== $objectStates;

        $hasBooleanRequirement =
            $counterHitRequired
            || $punishCounterRequired
            || $cornerRequired
            || $airborneRequired
            || $notCrouchingRequired
            || $sideSwitchesRequired;

        if (!$hasBooleanRequirement && !$hasObjectStates) {
            return null;
        }

        $comboRequirement = new ComboRequirement();
        $comboRequirement->setSequence($sequence)
            ->setCounterHitRequired($counterHitRequired)
            ->setPunishCounterRequired($punishCounterRequired)
            ->setCornerRequired($cornerRequired)
            ->setAirborneRequired($airborneRequired)
            ->setNotCrouchingRequired($notCrouchingRequired)
            ->setSideSwitchesRequired($sideSwitchesRequired);

        foreach ($objectStates as $objectState) {
            $comboRequirement->addCharacterObjectState($objectState);
        }

        return $comboRequirement;
    }

    /**
     * @param array<string, mixed> $requirements
     *
     * @return list<array<string, mixed>>
     */
    private function objectStatePayloads(array $requirements): array
    {
        if (isset($requirements['combo_object_states']) && is_array($requirements['combo_object_states'])) {
            return array_values(array_filter($requirements['combo_object_states'], 'is_array'));
        }

        if (is_array($requirements['requirement_specific_character'] ?? null)) {
            return [$requirements['requirement_specific_character']];
        }

        return [];
    }

    /** @param array<string, mixed> $payload */
    private function buildObjectState(array $payload, ComboSequences $sequence): CharacterObjectState
    {
        $sequenceCharacterName = $sequence->getCharacter()?->getName();
        $objectKeyOrName = $this->catalog->normalizeObjectKey($payload['object_key'] ?? $payload['object_name'] ?? null);
        if (null === $objectKeyOrName) {
            throw new InvalidArgumentException('combo_object_states.object_key is required.');
        }

        $definition = $this->catalog->definition($objectKeyOrName, $sequenceCharacterName);
        if (null === $definition) {
            throw new InvalidArgumentException(sprintf('Unsupported combo object: %s', $objectKeyOrName));
        }

        $statusRequired = $this->catalog->normalizeStatusValue($definition['object_key'], $payload['status_required'] ?? null, 'status_required');
        $consumed = (bool) ($payload['consumed'] ?? false);
        if ($consumed && true !== $definition['can_be_consumed']) {
            throw new InvalidArgumentException(sprintf('%s cannot be marked consumed.', $definition['name']));
        }

        $addedRelative = $this->catalog->normalizeStatusValue($definition['object_key'], $payload['added_relative'] ?? null, 'added_relative');
        if (null !== $addedRelative && true !== $definition['can_be_added_relative']) {
            throw new InvalidArgumentException(sprintf('%s cannot be added relatively.', $definition['name']));
        }

        $addedAbsolute = $this->catalog->normalizeStatusValue($definition['object_key'], $payload['added_absolute'] ?? null, 'added_absolute');
        if (null !== $addedAbsolute && true !== $definition['can_be_added_absolute']) {
            throw new InvalidArgumentException(sprintf('%s cannot be added absolutely.', $definition['name']));
        }

        if (null !== $addedRelative && null !== $addedAbsolute) {
            throw new InvalidArgumentException(sprintf('%s cannot have both relative and absolute added values.', $definition['name']));
        }

        if (null === $statusRequired && !$consumed && null === $addedRelative && null === $addedAbsolute) {
            throw new InvalidArgumentException(sprintf('%s needs at least one required, consumed, or added value.', $definition['name']));
        }

        return (new CharacterObjectState())
            ->setCharacterName($definition['character_name'])
            ->setObjectKey($definition['object_key'])
            ->setObjectName($definition['name'])
            ->setStatusRequired($statusRequired)
            ->setConsumed($consumed)
            ->setAddedRelative($addedRelative)
            ->setAddedAbsolute($addedAbsolute);
    }
}
