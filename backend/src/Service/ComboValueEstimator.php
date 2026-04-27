<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ComboMetrics;
use App\Entity\ComboSequences;

final class ComboValueEstimator
{
    public function __construct(
        private readonly float $driveBarValue,
        private readonly float $superBarValue,
    ) {
    }

    public function estimateMetricsValue(?ComboMetrics $metrics): ?float
    {
        if (null === $metrics || null === $metrics->getDamage()) {
            return null;
        }

        $netDriveCost = ($metrics->getDriveCost() ?? 0.0) - ($metrics->getDriveGain() ?? 0.0);
        $netSuperCost = ($metrics->getSuperCost() ?? 0.0) - ($metrics->getSuperGain() ?? 0.0);

        return (float) $metrics->getDamage()
            - ($netDriveCost * $this->driveBarValue)
            - ($netSuperCost * $this->superBarValue);
    }

    /**
     * @param list<ComboSequences> $combos
     * @return list<ComboSequences>
     */
    public function sortByEstimatedValue(array $combos): array
    {
        usort($combos, function (ComboSequences $left, ComboSequences $right): int {
            $leftValue = $this->estimateMetricsValue($left->getComboMetrics());
            $rightValue = $this->estimateMetricsValue($right->getComboMetrics());

            if ($leftValue === $rightValue) {
                return ($left->getId() ?? 0) <=> ($right->getId() ?? 0);
            }

            if (null === $leftValue) {
                return 1;
            }

            if (null === $rightValue) {
                return -1;
            }

            return $rightValue <=> $leftValue;
        });

        return $combos;
    }
}
