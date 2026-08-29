<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ComboMetrics;
use App\Entity\CharacterObjectState;
use App\Entity\ComboSequences;

final class ComboValueEstimator
{
    private const DRIVE_BAR_VALUE = 200.0;
    private const SUPER_BAR_VALUE = 500.0;
    private const OBJECT_UNIT_VALUE = 200.0;

    public function estimateMetricsValue(?ComboMetrics $metrics): ?float
    {
        return $this->estimateMetricsValueV1($metrics);
    }

    public function applyEstimatedValue(ComboMetrics $metrics): void
    {
        $metrics->setResourceAdjustedDamage($this->estimateMetricsValue($metrics));
    }

    /**
     * @param array{health?:float,drive?:float,super?:float,objectStatuses?:array<string,string>}|null $resourceContext
     */
    public function estimateSequenceValue(ComboSequences $combo, ?array $resourceContext = null): ?float
    {
        $metricsValue = $this->estimateMetricsValue($combo->getComboMetrics());
        if (null === $metricsValue) {
            return null;
        }

        return $metricsValue + $this->estimateObjectDeltaValue($combo, $resourceContext['objectStatuses'] ?? []);
    }

    /**
     * @param array{health?:float,drive?:float,super?:float,objectStatuses?:array<string,string>}|null $resourceContext
     *
     * @return array{health?:float,drive?:float,super?:float,objectStatuses?:array<string,string>}
     */
    public function applySequenceResourceDeltas(ComboSequences $combo, ?array $resourceContext): array
    {
        $next = is_array($resourceContext) ? $resourceContext : [];
        $metrics = $combo->getComboMetrics();
        if ($metrics instanceof ComboMetrics) {
            if (isset($next['drive']) && is_numeric($next['drive'])) {
                $next['drive'] = max(0.0, min(6.0, (float) $next['drive'] - ($metrics->getDriveCost() ?? 0.0) + ($metrics->getDriveGain() ?? 0.0)));
            }
            if (isset($next['super']) && is_numeric($next['super'])) {
                $next['super'] = max(0.0, min(3.0, (float) $next['super'] - ($metrics->getSuperCost() ?? 0.0) + ($metrics->getSuperGain() ?? 0.0)));
            }
        }

        $objectStatuses = $next['objectStatuses'] ?? [];
        if (!is_array($objectStatuses)) {
            $objectStatuses = [];
        }

        foreach ($combo->getComboRequirement()?->getCharacterObjectStates()->toArray() ?? [] as $objectState) {
            if (!$objectState instanceof CharacterObjectState) {
                continue;
            }

            $objectKey = $this->objectContextKey($objectState);
            if (null === $objectKey) {
                continue;
            }

            $currentValue = $objectStatuses[$objectKey] ?? null;
            if ($objectState->isConsumed()) {
                $currentValue = $this->consumeObjectStatus($currentValue);
            }
            if (null !== $objectState->getAddedRelative()) {
                $currentValue = $this->addRelativeObjectStatus($currentValue, $objectState->getAddedRelative());
            }
            if (null !== $objectState->getAddedAbsolute()) {
                $currentValue = $objectState->getAddedAbsolute();
            }

            if (null === $currentValue || '' === $currentValue || '0' === $currentValue || 'false' === $currentValue) {
                unset($objectStatuses[$objectKey]);
            } else {
                $objectStatuses[$objectKey] = $currentValue;
            }
        }

        $next['objectStatuses'] = $objectStatuses;

        return $next;
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

    /** @param array<string,string> $objectStatuses */
    private function estimateObjectDeltaValue(ComboSequences $combo, array $objectStatuses): float
    {
        $value = 0.0;
        foreach ($combo->getComboRequirement()?->getCharacterObjectStates()->toArray() ?? [] as $objectState) {
            if (!$objectState instanceof CharacterObjectState) {
                continue;
            }

            if ($objectState->isConsumed()) {
                $value -= self::OBJECT_UNIT_VALUE;
            }
            if (null !== $objectState->getAddedRelative()) {
                $value += $this->objectStatusMagnitude($objectState->getAddedRelative()) * self::OBJECT_UNIT_VALUE;
            }
            if (null !== $objectState->getAddedAbsolute()) {
                $objectKey = $this->objectContextKey($objectState);
                $current = null !== $objectKey ? ($objectStatuses[$objectKey] ?? null) : null;
                $value += max(0.0, $this->objectStatusMagnitude($objectState->getAddedAbsolute()) - $this->objectStatusMagnitude($current)) * self::OBJECT_UNIT_VALUE;
            }
        }

        return $value;
    }

    private function objectContextKey(CharacterObjectState $objectState): ?string
    {
        return $objectState->getObjectKey() ?? $objectState->getObjectName();
    }

    private function objectStatusMagnitude(?string $value): float
    {
        if (null === $value) {
            return 0.0;
        }

        $normalized = strtolower(trim($value));
        if ('' === $normalized || 'false' === $normalized || '0' === $normalized) {
            return 0.0;
        }
        if ('true' === $normalized || 'yes' === $normalized || '1' === $normalized) {
            return 1.0;
        }

        return is_numeric($normalized) ? max(0.0, (float) $normalized) : 0.0;
    }

    private function consumeObjectStatus(?string $value): ?string
    {
        $magnitude = $this->objectStatusMagnitude($value);
        if ($magnitude <= 1.0) {
            return null;
        }

        return (string) ((int) $magnitude - 1);
    }

    private function addRelativeObjectStatus(?string $currentValue, string $delta): string
    {
        if ('true' === strtolower(trim($delta))) {
            return 'true';
        }

        return (string) ((int) $this->objectStatusMagnitude($currentValue) + (int) $this->objectStatusMagnitude($delta));
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
