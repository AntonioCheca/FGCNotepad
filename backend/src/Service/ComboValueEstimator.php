<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ComboMetrics;
use App\Entity\ComboSequences;

final class ComboValueEstimator
{
    private const DRIVE_BAR_VALUE = 200.0;
    private const SUPER_BAR_VALUE = 500.0;

    public function estimateMetricsValue(?ComboMetrics $metrics): ?float
    {
        return $this->estimateMetricsValueV1($metrics);
    }

    public function applyEstimatedValue(ComboMetrics $metrics): void
    {
        $metrics->setResourceAdjustedDamage($this->estimateMetricsValue($metrics));
    }

    private function estimateMetricsValueV1(?ComboMetrics $metrics): ?float
    {
        if (null === $metrics || null === $metrics->getDamage()) {
            return null;
        }

        $netDriveCost = ($metrics->getDriveCost() ?? 0.0) - ($metrics->getDriveGain() ?? 0.0);
        $netSuperCost = ($metrics->getSuperCost() ?? 0.0) - ($metrics->getSuperGain() ?? 0.0);

        return (float) $metrics->getDamage()
            - ($netDriveCost * self::DRIVE_BAR_VALUE)
            - ($netSuperCost * self::SUPER_BAR_VALUE);
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
