<?php declare(strict_types=1);

namespace App\Service;

final class Sf6ComboResourceEstimatorService
{
    private const DRIVE_BAR_UNITS = 10000.0;
    private const SUPER_BAR_UNITS = 10000.0;
    private const PASSIVE_DRIVE_REGEN_PER_FRAME = 40;
    private const DRIVE_RUSH_CANCEL_COST_UNITS = 30000;

    public function __construct(private Sf6ComboFrameLengthEstimatorService $frameLengthEstimator)
    {
    }

    /**
     * @param list<array{moveType:string,notation:string,driveGain?:int|null,onHitSelfSuperMeterGain?:int|null,startup?:int|null,active?:int|null,hitstop?:int|null,recovery?:int|null,connectionTypeName?:string|null}> $moves
     *
     * @return array{driveUsed:float,driveGain:float,superUsed:float,superGain:float,totalFrames:int,warnings:list<string>}
     */
    public function estimate(array $moves): array
    {
        if ([] === $moves) {
            return [
                'driveUsed' => 0.0,
                'driveGain' => 0.0,
                'superUsed' => 0.0,
                'superGain' => 0.0,
                'totalFrames' => 0,
                'warnings' => [],
            ];
        }

        $frameEstimation = $this->frameLengthEstimator->estimate($moves);

        $driveGainFromMoves = 0;
        $driveUsedUnitsFromFrameData = 0;
        $superGainFromMoves = 0;
        $superUsedUnitsFromFrameData = 0;
        $superUsedUnitsFromInference = 0;

        foreach ($moves as $move) {
            $driveGain = $this->readSignedMeterValue($move['driveGain'] ?? null);
            if ($driveGain > 0) {
                $driveGainFromMoves += $driveGain;
            }
            if ($driveGain < 0) {
                $driveUsedUnitsFromFrameData += abs($driveGain);
            }

            if ($this->isDriveRushCancel($move['connectionTypeName'] ?? null)) {
                $driveUsedUnitsFromFrameData += self::DRIVE_RUSH_CANCEL_COST_UNITS;
            }

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

        $passiveDriveGain = $frameEstimation['totalFrames'] * self::PASSIVE_DRIVE_REGEN_PER_FRAME;

        $superUsedUnits = $superUsedUnitsFromFrameData > 0 ? $superUsedUnitsFromFrameData : $superUsedUnitsFromInference;

        return [
            'driveUsed' => $this->toBars($driveUsedUnitsFromFrameData, self::DRIVE_BAR_UNITS),
            'driveGain' => $this->toBars($driveGainFromMoves + $passiveDriveGain, self::DRIVE_BAR_UNITS),
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
