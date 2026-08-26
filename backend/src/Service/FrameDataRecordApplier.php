<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\FrameData;

final class FrameDataRecordApplier
{
    public function __construct(private readonly FrameDataScalingNormalizerService $scalingNormalizer)
    {
    }

    /**
     * @param array<string, mixed> $record
     * @param list<string> $warnings
     */
    public function applyFatRecord(FrameData $frameData, array $record, array &$warnings = []): bool
    {
        $rawScaling = isset($record['dmgScaling']) && is_string($record['dmgScaling']) ? $record['dmgScaling'] : null;
        $scaling = $this->scalingNormalizer->normalize($rawScaling);
        foreach ($scaling->warnings as $warning) {
            $warnings[] = $warning;
        }

        return $this->applyValues($frameData, [
            'startup' => (int) ($record['startup'] ?? 0),
            'active' => (int) ($record['active'] ?? 0),
            'recovery' => (int) ($record['recovery'] ?? 0),
            'total' => (int) ($record['total'] ?? 0),
            'onHit' => (int) ($record['onHit'] ?? 0),
            'onBlock' => (int) ($record['onBlock'] ?? 0),
            'onPunishCounter' => (int) ($record['onPC'] ?? 0),
            'moveType' => (string) ($record['moveType'] ?? 'normal'),
            'cancelsTo' => json_encode($record['xx'] ?? []) ?: '[]',
            'damage' => $this->parseDamageValue($record['fullDmg'] ?? $record['dmg'] ?? null),
            'scaling' => $rawScaling,
            'scalingStartPercent' => $scaling->startPercent,
            'scalingImmediatePercent' => $scaling->immediatePercent,
            'scalingMinimumPercent' => $scaling->minimumPercent,
            'scalingComboHits' => $scaling->comboHits,
            'scalingComboExtraPercent' => $scaling->comboExtraPercent,
            'scalingMultiplierPercent' => $scaling->multiplierPercent,
            'scalingParseStatus' => $scaling->parseStatus,
            'scalingParseNote' => $scaling->parseNote,
            'chipDamage' => (int) ($record['chp'] ?? 0),
            'attackLevel' => (string) ($record['atkLvl'] ?? 'Unknown'),
            'onHitAfterDriveRush' => (int) ($record['DRoH'] ?? 0),
            'onBlockAfterDriveRush' => (int) ($record['DRoB'] ?? 0),
            'onPerfectParry' => (int) ($record['onPP'] ?? 0),
            'driveDamageOnHit' => (int) ($record['DDoH'] ?? 0),
            'driveDamageOnBlock' => (int) ($record['DDoB'] ?? 0),
            'driveGain' => (int) ($record['DGain'] ?? 0),
            'onHitSelfSuperMeterGain' => (int) ($record['SelfSoH'] ?? 0),
            'onBlockSelfSuperMeterGain' => (int) ($record['SelfSoB'] ?? 0),
            'onHitOpponentSuperMeterGain' => (int) ($record['OppSoH'] ?? 0),
            'onBlockOpponentSuperMeterGain' => (int) ($record['OppSoB'] ?? 0),
            'hitConfirmSpecialsAndSupers' => (int) ($record['hcWinSpCa'] ?? 0),
            'hitConfirmTargetCombos' => (int) ($record['hcWinTc'] ?? 0),
            'juggleLimit' => (int) ($record['jugLimit'] ?? 0),
            'juggleIncrease' => (int) ($record['jugIncr'] ?? 0),
            'juggleStart' => (int) ($record['jugStart'] ?? 0),
            'hitstun' => (int) ($record['hitstun'] ?? 0),
            'blockstun' => (int) ($record['blockstun'] ?? 0),
            'hitstop' => (int) ($record['hitstop'] ?? 0),
            'extraInformation' => $this->buildExtraInformation($record),
        ]);
    }

    /**
     * @param array<string, mixed> $values
     */
    public function applyValues(FrameData $frameData, array $values): bool
    {
        $changed = false;
        foreach ($values as $columnName => $value) {
            if ($frameData->getRawValue($columnName) === $value) {
                continue;
            }

            $setter = 'set' . ucfirst($columnName);
            if (!method_exists($frameData, $setter)) {
                throw new \InvalidArgumentException(sprintf('Unsupported frame-data column "%s".', $columnName));
            }

            $frameData->{$setter}($value);
            $changed = true;
        }

        return $changed;
    }

    /**
     * @param array<string, mixed> $record
     */
    private function buildExtraInformation(array $record): string
    {
        $extraInfo = is_array($record['extraInfo'] ?? null) ? $record['extraInfo'] : [];
        $damageParts = $this->parseDamageParts($record['fullDmg'] ?? null);
        if ([] !== $damageParts) {
            $extraInfo[] = ['fatDamageParts' => $damageParts];
        }

        return json_encode($extraInfo) ?: '[]';
    }

    /** @return list<int> */
    private function parseDamageParts(mixed $value): array
    {
        if (!is_string($value) || preg_match('/\(([^)]*)\)/', $value, $matches) !== 1) {
            return [];
        }

        preg_match_all('/\d+/', $matches[1], $partMatches);
        $parts = array_map('intval', $partMatches[0]);

        return count($parts) > 1 ? $parts : [];
    }

    public function parseDamageValue(mixed $value): int
    {
        if (is_int($value)) {
            return $value;
        }

        if (is_float($value)) {
            return (int) $value;
        }

        if (!is_string($value)) {
            return 0;
        }

        if (preg_match('/\d+/', trim($value), $matches) !== 1) {
            return 0;
        }

        return (int) $matches[0];
    }
}
