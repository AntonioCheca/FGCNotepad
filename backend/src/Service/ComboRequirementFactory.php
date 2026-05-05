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

        $statusRequired = $this->normalizeStatusRequired($objectName, $specificCharacterData['status_required'] ?? null);
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
                ->setStatusRequired($statusRequired)
                ->setRequirement($comboRequirement);

            $comboRequirement->setRequirementSpecificCharacter($specificRequirement);
        }

        return $comboRequirement;
    }

    private function normalizeStatusRequired(?string $objectName, mixed $statusRequired): ?string
    {
        if (null === $objectName) {
            return null;
        }

        if (!$this->catalog->supportsObject($objectName)) {
            throw new InvalidArgumentException(sprintf('Unsupported requirement_specific_character.object_name: %s', $objectName));
        }

        $statusType = $this->catalog->statusType($objectName);

        if ('integer' === $statusType) {
            if (is_string($statusRequired) && '' === trim($statusRequired)) {
                return null;
            }

            if (is_string($statusRequired)) {
                if (!preg_match('/^\d+$/', trim($statusRequired))) {
                    throw new InvalidArgumentException(sprintf('%s requires an integer status_required value.', $objectName));
                }

                $statusRequired = (int) trim($statusRequired);
            }

            if (!is_int($statusRequired)) {
                throw new InvalidArgumentException(sprintf('%s requires an integer status_required value.', $objectName));
            }

            $maxStatus = $this->catalog->maxStatus($objectName);
            if (null !== $maxStatus && ($statusRequired < 1 || $statusRequired > $maxStatus)) {
                throw new InvalidArgumentException(sprintf('%s status_required must be between 1 and %d.', $objectName, $maxStatus));
            }

            return (string) $statusRequired;
        }

        if (null === $statusRequired) {
            return null;
        }

        if (is_string($statusRequired)) {
            $normalizedValue = strtolower(trim($statusRequired));
            if ('' === $normalizedValue) {
                return null;
            }

            if (in_array($normalizedValue, ['true', '1', 'yes'], true)) {
                return 'true';
            }

            throw new InvalidArgumentException(sprintf('%s requires a boolean status_required value.', $objectName));
        }

        if (true === $statusRequired || 1 === $statusRequired) {
            return 'true';
        }

        throw new InvalidArgumentException(sprintf('%s requires a boolean status_required value.', $objectName));
    }
}
