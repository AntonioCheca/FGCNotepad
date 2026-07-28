<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ComboRequirement;
use App\Entity\ComboSequences;
use App\Entity\FrameData;
use App\Entity\Move;
use App\Entity\Situation;
use App\Entity\Step;

class SituationComboMatcher
{
    public function evaluate(ComboSequences $combo, Situation $situation): CompatibilityResult
    {
        $reasons = [];
        $warnings = [];
        $incompatible = false;
        $uncertain = false;

        $starterMove = $this->getStarterMove($combo);
        $starterFrameData = $starterMove?->getFrameData();

        if (!$starterMove instanceof Move) {
            $uncertain = true;
            $warnings[] = 'Starter move is not available for compatibility evaluation.';
        }

        if (null !== $situation->getPunishWindowFrames()) {
            if (!$starterFrameData instanceof FrameData || null === $starterFrameData->getStartup()) {
                $uncertain = true;
                $warnings[] = 'Starter startup has not been measured.';
            } elseif ($starterFrameData->getStartup() > $situation->getPunishWindowFrames()) {
                $incompatible = true;
                $reasons[] = 'Starter startup is slower than the available punish window.';
            } else {
                $reasons[] = 'Starter startup fits within the punish window.';
            }
        }

        $requirement = $combo->getComboRequirement();
        [$requirementIncompatible, $requirementUncertain, $requirementReasons, $requirementWarnings] = $this->evaluateRequirements($requirement, $situation);
        $incompatible = $incompatible || $requirementIncompatible;
        $uncertain = $uncertain || $requirementUncertain;
        $reasons = array_merge($reasons, $requirementReasons);
        $warnings = array_merge($warnings, $requirementWarnings);

        if (null !== $situation->getStartingDistanceMeters()) {
            $uncertain = true;
            $warnings[] = 'Starter reach has not been measured in metres.';
        }

        if ($combo->getSpacing()?->getCode() === 'punish_tip') {
            $reasons[] = 'Combo is classified for extended hurtbox punish spacing.';
        }

        if ($incompatible) {
            return new CompatibilityResult(CompatibilityResult::INCOMPATIBLE, $reasons, $warnings);
        }

        return new CompatibilityResult(
            $uncertain ? CompatibilityResult::UNCERTAIN : CompatibilityResult::COMPATIBLE,
            [] === $reasons ? ['No incompatible situation constraints were found.'] : $reasons,
            $warnings,
        );
    }

    /**
     * @return array{0:bool,1:bool,2:list<string>,3:list<string>}
     */
    private function evaluateRequirements(?ComboRequirement $requirement, Situation $situation): array
    {
        $reasons = [];
        $warnings = [];
        $incompatible = false;
        $uncertain = false;

        if (!$requirement instanceof ComboRequirement) {
            return [false, false, ['Combo has no special starter requirements recorded.'], []];
        }

        [$counterIncompatible, $counterReasons] = $this->evaluateCounterState($requirement, $situation);
        $incompatible = $incompatible || $counterIncompatible;
        $reasons = array_merge($reasons, $counterReasons);

        if ($requirement->isCornerRequired()) {
            if (Situation::CORNER_MIDSCREEN === $situation->getCornerState()) {
                $incompatible = true;
                $reasons[] = 'Combo requires the corner but the situation is midscreen.';
            } else {
                $reasons[] = 'Corner requirement is satisfied by the situation.';
            }
        }

        if ($requirement->isAirborneRequired() && Situation::OPPONENT_STATE_GROUNDED === $situation->getOpponentState()) {
            $incompatible = true;
            $reasons[] = 'Combo requires an airborne opponent but the situation starts grounded.';
        }

        if (null !== $requirement->getInitialOpponentPosture()) {
            $uncertain = true;
            $warnings[] = 'Opponent posture compatibility is classified on the combo but not available on the situation.';
        }

        $groundState = $requirement->getInitialOpponentGroundState();
        if (null === $groundState) {
            if (Situation::OPPONENT_STATE_AIRBORNE === $situation->getOpponentState() && !$requirement->isAirborneRequired()) {
                $uncertain = true;
                $warnings[] = 'Starter state compatibility is not classified for airborne opponents.';
            }
        } elseif ($situation->getOpponentState() !== $groundState) {
            $incompatible = true;
            $reasons[] = 'Combo starter does not support the situation opponent ground state.';
        } else {
            $reasons[] = 'Combo starter supports the situation opponent ground state.';
        }

        if (Situation::OPPONENT_STATE_AIRBORNE === $situation->getOpponentState()) {
            $altitude = $situation->getInitialJuggleAltitude();
            $supportedAltitude = $requirement->getInitialJuggleAltitude();
            if (null === $altitude) {
                $uncertain = true;
                $warnings[] = 'Airborne situation does not have an initial juggle altitude.';
            } elseif (null === $supportedAltitude) {
                $uncertain = true;
                $warnings[] = 'Juggle altitude compatibility is not classified.';
            } elseif ($altitude !== $supportedAltitude) {
                $incompatible = true;
                $reasons[] = 'Combo starter does not support the situation juggle altitude.';
            } else {
                $reasons[] = 'Combo starter supports the situation juggle altitude.';
            }
        }

        return [$incompatible, $uncertain, $reasons, $warnings];
    }

    /** @return array{0:bool,1:list<string>} */
    private function evaluateCounterState(ComboRequirement $requirement, Situation $situation): array
    {
        $state = $situation->getCounterHitState();
        if ($requirement->isPunishCounterRequired()) {
            if (Situation::COUNTER_PUNISH_COUNTER !== $state) {
                return [true, ['Combo requires Punish Counter but the situation does not provide it.']];
            }

            return [false, ['Combo supports Punish Counter.']];
        }

        if ($requirement->isCounterHitRequired()) {
            if (Situation::COUNTER_NORMAL === $state) {
                return [true, ['Combo requires Counter Hit or Punish Counter but the situation is normal hit state.']];
            }

            return [false, ['Combo counter-hit requirement is satisfied by the situation.']];
        }

        return [false, ['Combo has no counter-hit starter requirement.']];
    }

    private function getStarterMove(ComboSequences $combo): ?Move
    {
        $steps = $combo->getSteps()->toArray();
        usort($steps, static fn (Step $left, Step $right): int => ($left->getOrdinalInCombo() ?? 0) <=> ($right->getOrdinalInCombo() ?? 0));
        $starter = $steps[0] ?? null;

        return $starter instanceof Step ? $starter->getChildSequence()?->getMove() : null;
    }
}
