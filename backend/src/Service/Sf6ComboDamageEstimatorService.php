<?php declare(strict_types=1);

namespace App\Service;

final class Sf6ComboDamageEstimatorService
{
    private const COMBO_HITS_DEFAULT_EXTRA_STEP_PENALTY = 1;

    /**
     * @param list<array{
     *   damage:int,
     *   moveType:string,
     *   notation:string,
     *   scalingStartPercent?:int|null,
     *   scalingImmediatePercent?:int|null,
     *   scalingMinimumPercent?:int|null,
     *   scalingComboHits?:int|null,
     *   scalingComboExtraPercent?:int|null,
     *   scalingMultiplierPercent?:int|null,
     *   damageParts?:list<int>
     * }> $moves
     * @param array{perfectParry?:bool,driveRushMidCombo?:bool,driveImpactState?:string,specialCancelIntoSa3?:bool,superArtLevels?:array<int,int>} $options
     *
     * @return array{estimatedDamage:int,stepDamages:list<int>,warnings:list<string>}
     */
    public function estimate(array $moves, array $options = []): array
    {
        if ([] === $moves) {
            return ['estimatedDamage' => 0, 'stepDamages' => [], 'warnings' => []];
        }

        $perfectParry = (bool) ($options['perfectParry'] ?? false);
        $driveRushMidCombo = (bool) ($options['driveRushMidCombo'] ?? false);
        $specialCancelIntoSa3 = (bool) ($options['specialCancelIntoSa3'] ?? false);
        $driveImpactState = is_string($options['driveImpactState'] ?? null) ? mb_strtolower(trim((string) $options['driveImpactState'])) : 'none';
        $superArtLevels = is_array($options['superArtLevels'] ?? null) ? $options['superArtLevels'] : [];

        $isLightStarter = $this->isLightOr2MkStarter($moves[0]['notation']);
        $baseScales = $this->buildBaseScales(count($moves) + 10, $isLightStarter, $this->readOptionalPercent($moves[0], 'scalingStartPercent'));

        $warnings = [];
        if ('none' !== $driveImpactState && !in_array($driveImpactState, ['none', 'blocked_wallsplat', 'hit_crumple'], true)) {
            $warnings[] = 'Unsupported driveImpactState value, ignoring it.';
            $driveImpactState = 'none';
        }

        $total = 0;
        $stepDamages = [];
        $comboPenaltyRemainingHits = 0;
        $comboPenaltyExtraPercent = 0;
        $hitCursor = 0;

        foreach ($moves as $index => $move) {
            $moveType = mb_strtolower(trim($move['moveType']));
            $isSuper = str_contains($moveType, 'super');
            $damageParts = $this->readDamageParts($move);
            $damageValues = [] === $damageParts ? [(int) $move['damage']] : $damageParts;
            $scaledDamage = 0;

            foreach ($damageValues as $partIndex => $damageValue) {
                $scale = (float) ($baseScales[$hitCursor + $partIndex] ?? 10);

                if ('blocked_wallsplat' === $driveImpactState || 'hit_crumple' === $driveImpactState) {
                    $scale *= 0.8;
                }

                if ($perfectParry) {
                    $scale *= 0.5;
                }

                if ($driveRushMidCombo) {
                    $scale *= 0.85;
                }

                if ($driveRushMidCombo || $perfectParry) {
                    $scale = floor($scale);
                }

                if ($index > 0 && $this->isThrowMove($move['moveType'], $move['notation'])) {
                    $scale *= 0.8;
                }

                if ($isSuper && $specialCancelIntoSa3 && $this->resolveSuperArtLevel($index, $move, $superArtLevels) === 3) {
                    $scale *= 0.9;
                }

                $immediatePercent = $this->readOptionalPercent($move, 'scalingImmediatePercent');
                if (null !== $immediatePercent) {
                    $scale = min($scale, (float) max(0, min(100, $immediatePercent)));
                }

                $multiplierPercent = $this->readOptionalPercent($move, 'scalingMultiplierPercent');
                if (null !== $multiplierPercent) {
                    $scale *= max(0.0, min(100.0, (float) $multiplierPercent)) / 100.0;
                }

                if ($comboPenaltyRemainingHits > 0) {
                    $scale -= $comboPenaltyExtraPercent;
                    $comboPenaltyRemainingHits--;
                }

                if ($scale < 4.0 && $perfectParry && $driveRushMidCombo) {
                    $scale = 4.0;
                }

                if ($scale < 10.0 && !($perfectParry || $driveRushMidCombo)) {
                    $scale = 10.0;
                }

                $scaledDamage += (int) floor($damageValue * ($scale / 100.0));
            }

            $minimumPercent = $this->readOptionalPercent($move, 'scalingMinimumPercent');
            if (null !== $minimumPercent) {
                $minimumDamage = (int) floor(((int) $move['damage']) * ($minimumPercent / 100.0));
                $scaledDamage = max($scaledDamage, $minimumDamage);
            }

            if ($isSuper) {
                $level = $this->resolveSuperArtLevel($index, $move, $superArtLevels);
                if (null === $level) {
                    $warnings[] = sprintf('Super level could not be inferred for step %d; minimum floor was not applied.', $index + 1);
                } else {
                    $minimumPercent = $level === 1 ? 30 : ($level === 2 ? 40 : 50);
                    $minimumDamage = (int) floor(((int) $move['damage']) * ($minimumPercent / 100.0));
                    $scaledDamage = max($scaledDamage, $minimumDamage);
                }
            }

            $comboHits = $this->readOptionalPositiveInt($move, 'scalingComboHits');
            if (null !== $comboHits && $comboHits > 0) {
                $comboPenaltyRemainingHits = $comboHits;

                $comboExtraPercent = $this->readOptionalPercent($move, 'scalingComboExtraPercent');
                $comboPenaltyExtraPercent = $comboExtraPercent ?? 0;
            } else {
                $comboExtraPercent = $this->readOptionalPercent($move, 'scalingComboExtraPercent');
                if (null !== $comboExtraPercent) {
                    $comboPenaltyRemainingHits = 1;
                    $comboPenaltyExtraPercent = $comboExtraPercent;
                }
            }

            if (0 === $index) {
                $hitCursor += [] === $damageParts ? 1 : count($damageParts);
            } else {
                $hitCursor += count($damageValues) + max(0, ($comboHits ?? 0) - self::COMBO_HITS_DEFAULT_EXTRA_STEP_PENALTY);
            }

            $stepDamages[] = $scaledDamage;
            $total += $scaledDamage;
        }

        return [
            'estimatedDamage' => $total,
            'stepDamages' => $stepDamages,
            'warnings' => array_values(array_unique($warnings)),
        ];
    }

    /**
     * @return list<int>
     */
    private function buildBaseScales(int $count, bool $isLightStarter, ?int $starterScalingPercent = null): array
    {
        $normal = [100, 100, 80, 70, 60, 50, 40, 30, 20, 10];
        $light = [100, 80, 70, 60, 50, 40, 30, 20, 10, 10];
        $table = $isLightStarter ? $light : $normal;
        if (null !== $starterScalingPercent) {
            $nextScale = min($table[1], max(10, 100 - $starterScalingPercent));
            for ($index = 1; $index < count($table); $index++) {
                $table[$index] = max(10, $nextScale - (($index - 1) * 10));
            }
        }

        $result = [];
        for ($i = 0; $i < $count; $i++) {
            $result[] = $table[$i] ?? 10;
        }

        return $result;
    }

    private function isLightOr2MkStarter(string $notation): bool
    {
        $normalized = mb_strtoupper(trim($notation));

        if (str_ends_with($normalized, 'LP') || str_ends_with($normalized, 'LK')) {
            return true;
        }

        return str_ends_with($normalized, '2MK');
    }

    private function isThrowMove(string $moveType, string $notation): bool
    {
        $normalizedType = mb_strtolower(trim($moveType));
        if (str_contains($normalizedType, 'throw') || str_contains($normalizedType, 'grab')) {
            return true;
        }

        $normalizedNotation = mb_strtoupper(trim($notation));

        return in_array($normalizedNotation, ['LP+LK', '4LP+LK', '6LP+LK'], true);
    }

    /**
     * @param array<int,int> $superArtLevels
     */
    private function resolveSuperArtLevel(int $index, array $move, array $superArtLevels): ?int
    {
        if (isset($superArtLevels[$index + 1]) && in_array($superArtLevels[$index + 1], [1, 2, 3], true)) {
            return (int) $superArtLevels[$index + 1];
        }

        $moveType = mb_strtolower(trim((string) $move['moveType']));
        if (str_contains($moveType, 'sa1') || str_contains($moveType, 'level1')) {
            return 1;
        }
        if (str_contains($moveType, 'sa2') || str_contains($moveType, 'level2')) {
            return 2;
        }
        if (str_contains($moveType, 'sa3') || str_contains($moveType, 'critical') || str_contains($moveType, 'ca') || str_contains($moveType, 'level3')) {
            return 3;
        }

        return null;
    }

    private function readOptionalPercent(array $move, string $key): ?int
    {
        if (!array_key_exists($key, $move)) {
            return null;
        }

        $value = $move[$key];
        if (!is_int($value)) {
            return null;
        }

        return $value;
    }

    private function readOptionalPositiveInt(array $move, string $key): ?int
    {
        if (!array_key_exists($key, $move)) {
            return null;
        }

        $value = $move[$key];
        if (!is_int($value) || $value <= 0) {
            return null;
        }

        return $value;
    }

    /**
     * @return list<int>
     */
    private function readDamageParts(array $move): array
    {
        if (!isset($move['damageParts']) || !is_array($move['damageParts'])) {
            return [];
        }

        $parts = [];
        foreach ($move['damageParts'] as $part) {
            if (!is_int($part) || $part <= 0) {
                return [];
            }

            $parts[] = $part;
        }

        return $parts;
    }
}
