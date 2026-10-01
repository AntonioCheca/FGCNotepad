<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Move;

/** Builds the per-move input of Sf6ComboDamageEstimatorService from a move's frame data. */
final class ComboDamageMoveInputFactory
{
    /**
     * @return array{damage:int,moveType:string,notation:string,scalingStartPercent:int|null,scalingImmediatePercent:int|null,scalingMinimumPercent:int|null,scalingComboHits:int|null,scalingComboExtraPercent:int|null,scalingMultiplierPercent:int|null,damageParts:list<int>,connectionTypeName:string|null,executionDamagePercent:int|null}|null
     */
    public function fromMove(Move $move, ?string $connectionTypeName = null, ?int $executionDamagePercent = null): ?array
    {
        $frameData = $move->getFrameData();
        if (null === $frameData || null === $frameData->getDamage()) {
            return null;
        }

        return [
            'damage' => (int) $frameData->getDamage(),
            'moveType' => (string) $frameData->getMoveType(),
            'notation' => $move->getNumpadNotation(),
            'scalingStartPercent' => $frameData->getScalingStartPercent(),
            'scalingImmediatePercent' => $frameData->getScalingImmediatePercent(),
            'scalingMinimumPercent' => $frameData->getScalingMinimumPercent(),
            'scalingComboHits' => $frameData->getScalingComboHits(),
            'scalingComboExtraPercent' => $frameData->getScalingComboExtraPercent(),
            'scalingMultiplierPercent' => $frameData->getScalingMultiplierPercent(),
            'damageParts' => $this->damageParts($frameData->getExtraInformation()),
            'connectionTypeName' => $connectionTypeName,
            'executionDamagePercent' => $executionDamagePercent,
        ];
    }

    /**
     * @return list<int>
     */
    private function damageParts(?string $extraInformation): array
    {
        if (null === $extraInformation) {
            return [];
        }

        $decoded = json_decode($extraInformation, true);
        if (!is_array($decoded)) {
            return [];
        }

        foreach ($decoded as $item) {
            if (!is_array($item) || !isset($item['fatDamageParts']) || !is_array($item['fatDamageParts'])) {
                continue;
            }

            $parts = [];
            foreach ($item['fatDamageParts'] as $part) {
                if (!is_int($part) || $part <= 0) {
                    return [];
                }

                $parts[] = $part;
            }

            return $parts;
        }

        return [];
    }
}
