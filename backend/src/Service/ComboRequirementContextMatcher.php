<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ComboRequirement;
use App\Entity\RequirementSpecificCharacter;

class ComboRequirementContextMatcher
{
    /**
     * @param array{allowedPositions:list<string>,characterStatuses:array<string,string>}|null $context
     */
    public function matches(?ComboRequirement $requirement, ?array $context): bool
    {
        if (null === $requirement || null === $context) {
            return true;
        }

        if (!$this->matchesPosition($requirement, $context['allowedPositions'])) {
            return false;
        }

        foreach ($requirement->getRequirementSpecificCharacters() as $statusRequirement) {
            if (!$this->matchesCharacterStatus($statusRequirement, $context['characterStatuses'])) {
                return false;
            }
        }

        return true;
    }

    /** @param list<string> $allowedPositions */
    private function matchesPosition(ComboRequirement $requirement, array $allowedPositions): bool
    {
        if (true === $requirement->isCornerRequired() && !in_array('corner', $allowedPositions, true)) {
            return false;
        }

        if (true === $requirement->isMidScreenRequired() && !in_array('midscreen', $allowedPositions, true)) {
            return false;
        }

        return true;
    }

    /** @param array<string,string> $availableStatuses */
    private function matchesCharacterStatus(RequirementSpecificCharacter $requirement, array $availableStatuses): bool
    {
        $objectName = $requirement->getObjectName();
        $requiredValue = $requirement->getStatusRequired();
        if (null === $objectName || null === $requiredValue || !array_key_exists($objectName, $availableStatuses)) {
            return false;
        }

        $availableValue = $availableStatuses[$objectName];
        if (ctype_digit($requiredValue) && ctype_digit($availableValue)) {
            return (int) $availableValue >= (int) $requiredValue;
        }

        return 'true' === $requiredValue && 'true' === $availableValue;
    }
}
