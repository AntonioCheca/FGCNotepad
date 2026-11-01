<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ScenarioColumn;
use App\Entity\ScenarioColumnResourceRequirement;
use App\Entity\ScenarioRow;
use App\Entity\ScenarioRowResourceRequirement;

/**
 * Prices the Drive and Super an option requires with the same bar values as combo resource-adjusted damage.
 * Payoffs are from the attacker's side, so an attacker requirement lowers the payoff and a defender one raises it.
 * The requirement threshold is treated as the amount the option spends.
 */
final class ScenarioAxisResourceCostService
{
    private const BAR_VALUE_BY_RESOURCE = [
        'drive' => ComboValueEstimator::DRIVE_BAR_VALUE,
        'super' => ComboValueEstimator::SUPER_BAR_VALUE,
    ];

    public function payoffAdjustment(ScenarioRow|ScenarioColumn $axis): float
    {
        $adjustment = 0.0;
        foreach ($axis->getResourceRequirements() as $requirement) {
            $adjustment += $this->requirementAdjustment($requirement);
        }

        return $adjustment;
    }

    private function requirementAdjustment(ScenarioRowResourceRequirement|ScenarioColumnResourceRequirement $requirement): float
    {
        $barValue = self::BAR_VALUE_BY_RESOURCE[$requirement->getResourceType()] ?? null;
        if (null === $barValue || '>=' !== $requirement->getOperator()) {
            return 0.0;
        }

        $cost = max(0.0, $requirement->getThresholdValue()) * $barValue;

        return 'attacker' === $requirement->getResourceOwner() ? -$cost : $cost;
    }
}
