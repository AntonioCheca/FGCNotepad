<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\Character;
use App\Entity\ComboRequirement;
use App\Entity\ComboSequences;
use App\Entity\FrameData;
use App\Entity\Move;
use App\Entity\Situation;
use App\Entity\SituationType;
use App\Entity\Step;
use App\Service\CompatibilityResult;
use App\Service\SituationComboMatcher;
use PHPUnit\Framework\TestCase;

class SituationComboMatcherTest extends TestCase
{
    public function testStartupSlowerThanPunishWindowIsIncompatible(): void
    {
        $combo = $this->comboWithStarter(8);
        $situation = $this->situation()
            ->setPunishWindowFrames(6);

        $result = (new SituationComboMatcher())->evaluate($combo, $situation);

        self::assertSame(CompatibilityResult::INCOMPATIBLE, $result->getStatus());
        self::assertContains('Starter startup is slower than the available punish window.', $result->getReasons());
    }

    public function testMissingReachForMeasuredDistanceIsUncertain(): void
    {
        $combo = $this->comboWithStarter(5);
        $situation = $this->situation()
            ->setPunishWindowFrames(6)
            ->setStartingDistanceMeters(1.25);

        $result = (new SituationComboMatcher())->evaluate($combo, $situation);

        self::assertSame(CompatibilityResult::UNCERTAIN, $result->getStatus());
        self::assertContains('Starter reach has not been measured in metres.', $result->getWarnings());
    }

    public function testAirborneAltitudeSupportCanBeCompatible(): void
    {
        $combo = $this->comboWithStarter(5);
        $requirement = (new ComboRequirement())
            ->setSequence($combo)
            ->setCounterHitRequired(false)
            ->setPunishCounterRequired(true)
            ->setCornerRequired(true)
            ->setAirborneRequired(true)
            ->setNotCrouchingRequired(false)
            ->setInitialOpponentGroundState(Situation::OPPONENT_STATE_AIRBORNE)
            ->setInitialJuggleAltitude(Situation::ALTITUDE_HIGH);
        $combo->setComboRequirement($requirement);

        $situation = $this->situation()
            ->setOpponentState(Situation::OPPONENT_STATE_AIRBORNE)
            ->setInitialJuggleAltitude(Situation::ALTITUDE_HIGH)
            ->setCornerState(Situation::CORNER_CORNER)
            ->setCounterHitState(Situation::COUNTER_PUNISH_COUNTER);

        $result = (new SituationComboMatcher())->evaluate($combo, $situation);

        self::assertSame(CompatibilityResult::COMPATIBLE, $result->getStatus());
        self::assertContains('Combo starter supports the situation juggle altitude.', $result->getReasons());
    }

    private function comboWithStarter(int $startup): ComboSequences
    {
        $character = (new Character())->setName('Akuma');
        $frameData = (new FrameData())->setStartup($startup);
        $move = (new Move())->setCharacter($character)->setNumpadNotation('5MP')->setFrameData($frameData);

        $leaf = (new ComboSequences())->setName('Akuma 5MP')->setDescription('starter')->setMove($move);
        $combo = (new ComboSequences())->setName('Akuma Route')->setDescription('route');
        $step = (new Step())->setChildSequence($leaf)->setOrdinalInCombo(1);
        $combo->addStep($step);

        return $combo;
    }

    private function situation(): Situation
    {
        $type = (new SituationType())->setCode(SituationType::BLOCKED_MOVE)->setName('Blocked move')->setDescription('Blocked move');

        return (new Situation())
            ->setType($type)
            ->setName('Blocked DP')
            ->setDescription('test')
            ->setOpponentState(Situation::OPPONENT_STATE_GROUNDED)
            ->setCornerState(Situation::CORNER_EITHER)
            ->setCounterHitState(Situation::COUNTER_NORMAL);
    }
}
