<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ComboRequirement;
use App\Entity\ComboSequences;
use App\Entity\RequirementSpecificCharacter;
use InvalidArgumentException;

class ComboRequirementFactory
{
    public function __construct(
        ?RequirementSpecificCharacterCatalog $catalog = null,
    ) {
        $this->catalog = $catalog ?? new RequirementSpecificCharacterCatalog();
    }

    private RequirementSpecificCharacterCatalog $catalog;

    /** @param array<string, mixed> $requirements */
    public function createFromPayload(ComboSequences $sequence, array $requirements): ?ComboRequirement
    {
        $counterHitRequired = (bool) ($requirements['counter_hit_required'] ?? false);
        $punishCounterRequired = (bool) ($requirements['punish_counter_required'] ?? false);
        $cornerRequired = (bool) ($requirements['corner_required'] ?? false);
        $airborneRequired = (bool) ($requirements['airborne_required'] ?? false);
        $midScreenRequired = (bool) ($requirements['mid_screen_required'] ?? false);
        $notCrouchingRequired = (bool) ($requirements['not_crouching_required'] ?? false);

        $specificCharacterData = is_array($requirements['requirement_specific_character'] ?? null)
            ? $requirements['requirement_specific_character']
            : null;

        if ($counterHitRequired && $punishCounterRequired) {
            throw new InvalidArgumentException('counter_hit_required and punish_counter_required cannot both be true.');
        }

        $objectName = $this->catalog->normalizeObjectName($specificCharacterData['object_name'] ?? null);
        if (null === $objectName && array_key_exists('status_required', $specificCharacterData ?? [])) {
            throw new InvalidArgumentException('requirement_specific_character.status_required requires requirement_specific_character.object_name.');
        }

        $statusRequired = null !== $objectName
            ? $this->catalog->normalizeStatusRequired($objectName, $specificCharacterData['status_required'] ?? null)
            : null;
        $hasSpecificCharacterRequirement = null !== $objectName && null !== $statusRequired;

        $hasBooleanRequirement =
            $counterHitRequired
            || $punishCounterRequired
            || $cornerRequired
            || $airborneRequired
            || $midScreenRequired
            || $notCrouchingRequired;

        if (!$hasBooleanRequirement && !$hasSpecificCharacterRequirement) {
            return null;
        }

        $comboRequirement = new ComboRequirement();
        $comboRequirement->setSequence($sequence)
            ->setCounterHitRequired($counterHitRequired)
            ->setPunishCounterRequired($punishCounterRequired)
            ->setCornerRequired($cornerRequired)
            ->setAirborneRequired($airborneRequired)
            ->setMidScreenRequired($midScreenRequired)
            ->setNotCrouchingRequired($notCrouchingRequired);

        if ($hasSpecificCharacterRequirement) {
            $specificRequirement = new RequirementSpecificCharacter();
            $specificRequirement->setObjectName($objectName)
                ->setStatusRequired($statusRequired);

            $comboRequirement->setRequirementSpecificCharacter($specificRequirement);
        }

        return $comboRequirement;
    }
}
