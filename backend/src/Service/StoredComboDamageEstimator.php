<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ComboSequences;
use App\Entity\Move;
use App\Entity\Step;
use App\Service\Modern\ModernMoveExecutionResolver;
use App\Util\Enum\ComboExecutionMode;

/** Runs Sf6ComboDamageEstimatorService over a stored combo: its ordered steps and its starter requirements. */
final class StoredComboDamageEstimator
{
    public function __construct(
        private readonly ModernMoveExecutionResolver $executionResolver,
        private readonly ComboDamageMoveInputFactory $damageInputFactory,
        private readonly Sf6ComboDamageEstimatorService $damageEstimator,
    ) {
    }

    /**
     * Steps whose move has no frame-data damage cannot be estimated and are reported with a null damage.
     *
     * @return array{estimatedDamage:int,steps:list<array{notation:string|null,connectionType:string|null,estimatedDamage:int|null}>,warnings:list<string>}
     */
    public function estimate(ComboSequences $sequence, ComboExecutionMode $mode = ComboExecutionMode::CLASSIC): array
    {
        $inputs = [];
        $steps = [];
        foreach ($this->orderedSteps($sequence) as $step) {
            $move = $step->getChildSequence()?->getMove();
            $connectionType = $step->getConnectionType()?->getName();
            $input = $move instanceof Move
                ? $this->damageInputFactory->fromMove($move, $connectionType, $this->executionResolver->resolve($move, $mode)->damagePercent)
                : null;
            $steps[] = ['notation' => $move?->getNumpadNotation(), 'connectionType' => $connectionType, 'estimatedDamage' => null === $input ? null : 0];
            if (null !== $input) {
                $inputs[] = $input;
            }
        }

        $estimation = $this->damageEstimator->estimate($inputs, $this->starterOptions($sequence));
        $stepDamages = $estimation['stepDamages'];
        foreach ($steps as $index => $step) {
            if (null !== $step['estimatedDamage']) {
                $steps[$index]['estimatedDamage'] = (int) array_shift($stepDamages);
            }
        }

        return ['estimatedDamage' => $estimation['estimatedDamage'], 'steps' => $steps, 'warnings' => $estimation['warnings']];
    }

    /** @return array{perfectParry:bool,driveImpactState:string,starterHitState:string|null} */
    private function starterOptions(ComboSequences $sequence): array
    {
        $requirement = $sequence->getComboRequirement();
        $perfectParry = true === $requirement?->isPerfectParryRequired();
        $starterHitState = match (true) {
            $perfectParry, true === $requirement?->isPunishCounterRequired() => ComboStarterModifierExtractor::STARTER_HIT_STATE_PUNISH_COUNTER,
            true === $requirement?->isCounterHitRequired() => ComboStarterModifierExtractor::STARTER_HIT_STATE_COUNTER_HIT,
            default => null,
        };

        return [
            'perfectParry' => $perfectParry,
            'driveImpactState' => true === $requirement?->isBlockedDriveImpactStunRequired() ? 'blocked_wallsplat' : 'none',
            'starterHitState' => $starterHitState,
        ];
    }

    /** @return list<Step> */
    private function orderedSteps(ComboSequences $sequence): array
    {
        $steps = array_values($sequence->getSteps()->toArray());
        usort($steps, static fn (Step $left, Step $right): int => ($left->getOrdinalInCombo() ?? 0) <=> ($right->getOrdinalInCombo() ?? 0));

        return $steps;
    }
}
