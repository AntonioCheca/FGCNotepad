<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ComboMetrics;
use App\Entity\ComboSequences;
use App\Entity\Move;
use App\Entity\Step;

final class ComboMetricsResourceRecalculationService
{
    public function __construct(private readonly Sf6ComboResourceEstimatorService $resourceEstimator)
    {
    }

    public function recalculate(ComboSequences $sequence): void
    {
        $metrics = $sequence->getComboMetrics();
        if (!$metrics instanceof ComboMetrics) {
            return;
        }

        $estimation = $this->resourceEstimator->estimate($this->resolveMoves($sequence));
        $metrics
            ->setDriveCost($estimation['driveUsed'])
            ->setDriveGain($estimation['driveGain'])
            ->setMinimumDriveCost($estimation['minimumDriveCost'])
            ->setMinimumDriveCostNoBurnout($estimation['minimumDriveCostNoBurnout'])
            ->setSuperCost($estimation['superUsed'])
            ->setSuperGain($estimation['superGain']);
    }

    /**
     * @return list<array{moveType:string,notation:string,driveGain?:int|null,onHitSelfSuperMeterGain?:int|null,startup?:int|null,active?:int|null,hitstop?:int|null,recovery?:int|null,connectionTypeName?:string|null}>
     */
    private function resolveMoves(ComboSequences $sequence): array
    {
        $steps = array_values(array_filter(
            $sequence->getSteps()->toArray(),
            static fn (mixed $step): bool => $step instanceof Step
        ));
        usort(
            $steps,
            static fn (Step $left, Step $right): int => ($left->getOrdinalInCombo() ?? 0) <=> ($right->getOrdinalInCombo() ?? 0)
        );

        $moves = [];
        foreach ($steps as $step) {
            $move = $step->getChildSequence()?->getMove();
            $frameData = $move instanceof Move ? $move->getFrameData() : null;
            if (!$move instanceof Move || null === $frameData) {
                continue;
            }

            $moves[] = [
                'moveType' => (string) $frameData->getMoveType(),
                'notation' => (string) $move->getNumpadNotation(),
                'driveGain' => $frameData->getDriveGain(),
                'onHitSelfSuperMeterGain' => $frameData->getOnHitSelfSuperMeterGain(),
                'startup' => $frameData->getStartup(),
                'active' => $frameData->getActive(),
                'hitstop' => $frameData->getHitstop(),
                'recovery' => $frameData->getRecovery(),
                'connectionTypeName' => $step->getConnectionType()?->getName(),
            ];
        }

        return $moves;
    }
}
