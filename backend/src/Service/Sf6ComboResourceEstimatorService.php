<?php declare(strict_types=1);

namespace App\Service;

final class Sf6ComboResourceEstimatorService
{
    private const DRIVE_BAR_UNITS = 10000.0;
    private const SUPER_BAR_UNITS = 10000.0;
    private const PASSIVE_DRIVE_REGEN_PER_FRAME = 40;
    private const DRIVE_RUSH_CANCEL_COST_UNITS = 30000;
    private const DRIVE_ACCESS_FLOOR_BARS = 0.1;
    private const MAX_DRIVE_BARS = 6.0;

    public function __construct(private Sf6ComboFrameLengthEstimatorService $frameLengthEstimator)
    {
    }

    /**
     * @param list<array{moveType:string,notation:string,driveGain?:int|null,onHitSelfSuperMeterGain?:int|null,startup?:int|null,active?:int|null,hitstop?:int|null,recovery?:int|null,connectionTypeName?:string|null}> $moves
     *
     * @return array{driveUsed:float,driveGain:float,minimumDriveCost:float|null,minimumDriveCostNoBurnout:float|null,superUsed:float,superGain:float,totalFrames:int,warnings:list<string>}
     */
    public function estimate(array $moves): array
    {
        if ([] === $moves) {
            return [
                'driveUsed' => 0.0,
                'driveGain' => 0.0,
                'minimumDriveCost' => 0.0,
                'minimumDriveCostNoBurnout' => self::DRIVE_ACCESS_FLOOR_BARS,
                'superUsed' => 0.0,
                'superGain' => 0.0,
                'totalFrames' => 0,
                'warnings' => [],
            ];
        }

        $frameEstimation = $this->frameLengthEstimator->estimate($moves);

        $driveGainUnitsTotal = 0;
        $driveUsedUnitsFromFrameData = 0;
        $superGainFromMoves = 0;
        $superUsedUnitsFromFrameData = 0;
        $superUsedUnitsFromInference = 0;
        $timelineSteps = [];
        $driveGainLocked = false;

        foreach ($moves as $index => $move) {
            $driveGain = $this->readSignedMeterValue($move['driveGain'] ?? null);
            $driveCostUnits = 0;
            $driveGainUnits = 0;
            if ($driveGain < 0) {
                $driveCostUnits += abs($driveGain);
            }

            if ($this->isDriveRushCancel($move['connectionTypeName'] ?? null)) {
                $driveCostUnits += self::DRIVE_RUSH_CANCEL_COST_UNITS;
                $driveGainLocked = true;
            }

            if ($this->isLevelThreeSuper((string) ($move['moveType'] ?? ''), (string) ($move['notation'] ?? ''))) {
                $driveGainLocked = false;
            }

            if (!$driveGainLocked) {
                if ($driveGain > 0) {
                    $driveGainUnits += $driveGain;
                }

                $driveGainUnits += ($frameEstimation['stepFrames'][$index] ?? 0) * self::PASSIVE_DRIVE_REGEN_PER_FRAME;
            }

            $driveUsedUnitsFromFrameData += $driveCostUnits;
            $driveGainUnitsTotal += $driveGainUnits;
            $timelineSteps[] = [
                'driveCost' => $this->toBars($driveCostUnits, self::DRIVE_BAR_UNITS),
                'driveGain' => $this->toBars($driveGainUnits, self::DRIVE_BAR_UNITS),
            ];

            $onHitSelfSuperMeterGain = $this->readSignedMeterValue($move['onHitSelfSuperMeterGain'] ?? null);
            if ($onHitSelfSuperMeterGain > 0) {
                $superGainFromMoves += $onHitSelfSuperMeterGain;
            }
            if ($onHitSelfSuperMeterGain < 0) {
                $superUsedUnitsFromFrameData += abs($onHitSelfSuperMeterGain);
            }

            if (0 === $onHitSelfSuperMeterGain) {
                $superUsedUnitsFromInference += $this->inferSuperCostUnits((string) ($move['moveType'] ?? ''), (string) ($move['notation'] ?? ''));
            }
        }

        $superUsedUnits = $superUsedUnitsFromFrameData > 0 ? $superUsedUnitsFromFrameData : $superUsedUnitsFromInference;

        return [
            'driveUsed' => $this->toBars($driveUsedUnitsFromFrameData, self::DRIVE_BAR_UNITS),
            'driveGain' => $this->toBars($driveGainUnitsTotal, self::DRIVE_BAR_UNITS),
            'minimumDriveCost' => $this->calculateMinimumDrive($timelineSteps, false),
            'minimumDriveCostNoBurnout' => $this->calculateMinimumDrive($timelineSteps, true),
            'superUsed' => $this->toBars($superUsedUnits, self::SUPER_BAR_UNITS),
            'superGain' => $this->toBars($superGainFromMoves, self::SUPER_BAR_UNITS),
            'totalFrames' => $frameEstimation['totalFrames'],
            'warnings' => $frameEstimation['warnings'],
        ];
    }

    private function readSignedMeterValue(mixed $value): int
    {
        return is_int($value) ? $value : 0;
    }

    private function toBars(int $units, float $barUnits): float
    {
        return round($units / $barUnits, 4);
    }

    private function isDriveRushCancel(?string $connectionTypeName): bool
    {
        if (null === $connectionTypeName) {
            return false;
        }

        $normalized = strtolower(trim($connectionTypeName));

        return in_array($normalized, ['dr cancel', 'drive rush cancel', 'drc'], true);
    }

    private function isLevelThreeSuper(string $moveType, string $notation): bool
    {
        if ('super' !== strtolower(trim($moveType))) {
            return false;
        }

        $normalizedNotation = strtoupper(trim($notation));

        return str_contains($normalizedNotation, 'SA3')
            || str_contains($normalizedNotation, 'CA')
            || str_contains($normalizedNotation, 'LEVEL3')
            || str_contains($normalizedNotation, 'CRITICAL');
    }

    /**
     * @param list<array{driveCost:float,driveGain:float}> $timelineSteps
     */
    private function calculateMinimumDrive(array $timelineSteps, bool $avoidBurnout): ?float
    {
        $hasDriveCost = false;
        foreach ($timelineSteps as $step) {
            if ($step['driveCost'] > 0.0) {
                $hasDriveCost = true;
                break;
            }
        }

        if (!$hasDriveCost) {
            return $avoidBurnout ? self::DRIVE_ACCESS_FLOOR_BARS : 0.0;
        }

        if (!$this->canRunDriveTimeline(self::MAX_DRIVE_BARS, $timelineSteps, $avoidBurnout)) {
            return null;
        }

        $low = self::DRIVE_ACCESS_FLOOR_BARS;
        $high = self::MAX_DRIVE_BARS;
        for ($iteration = 0; $iteration < 40; ++$iteration) {
            $mid = ($low + $high) / 2.0;
            if ($this->canRunDriveTimeline($mid, $timelineSteps, $avoidBurnout)) {
                $high = $mid;
            } else {
                $low = $mid;
            }
        }

        return round($high, 4);
    }

    /**
     * @param list<array{driveCost:float,driveGain:float}> $timelineSteps
     */
    private function canRunDriveTimeline(float $startingDrive, array $timelineSteps, bool $avoidBurnout): bool
    {
        $drive = min(self::MAX_DRIVE_BARS, $startingDrive);
        $burnedOut = false;

        foreach ($timelineSteps as $step) {
            $driveCost = $step['driveCost'];
            if ($driveCost > 0.0) {
                if ($burnedOut || $drive < self::DRIVE_ACCESS_FLOOR_BARS) {
                    return false;
                }

                $drive -= $driveCost;
                if ($drive < self::DRIVE_ACCESS_FLOOR_BARS) {
                    if ($avoidBurnout) {
                        return false;
                    }

                    $burnedOut = true;
                }
            }

            if (!$burnedOut) {
                $drive = min(self::MAX_DRIVE_BARS, $drive + $step['driveGain']);
                if ($avoidBurnout && $drive < self::DRIVE_ACCESS_FLOOR_BARS) {
                    return false;
                }
            }
        }

        return !$avoidBurnout || $drive >= self::DRIVE_ACCESS_FLOOR_BARS;
    }

    private function inferSuperCostUnits(string $moveType, string $notation): int
    {
        if ('super' !== strtolower(trim($moveType))) {
            return 0;
        }

        $normalizedNotation = strtoupper(trim($notation));
        if (str_contains($normalizedNotation, 'SA1') || str_contains($normalizedNotation, 'LEVEL1')) {
            return 10000;
        }
        if (str_contains($normalizedNotation, 'SA2') || str_contains($normalizedNotation, 'LEVEL2')) {
            return 20000;
        }

        return 30000;
    }
}
