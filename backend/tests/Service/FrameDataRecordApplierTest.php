<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\FrameData;
use App\Service\FrameDataRecordApplier;
use App\Service\FrameDataScalingNormalizerService;
use PHPUnit\Framework\TestCase;

final class FrameDataRecordApplierTest extends TestCase
{
    public function testItComparesAgainstRawValuesInsteadOfEffectiveOverrides(): void
    {
        $frameData = (new FrameData())
            ->setStartup(6)
            ->setActive(3)
            ->setRecovery(16)
            ->setTotal(24)
            ->setOnHit(2)
            ->setOnBlock(-1)
            ->setOnPunishCounter(4)
            ->setMoveType('normal')
            ->setCancelsTo('[]')
            ->setDamage(700)
            ->setScaling(null)
            ->setScalingParseStatus('unparsed')
            ->setChipDamage(0)
            ->setAttackLevel('2')
            ->setOnHitAfterDriveRush(0)
            ->setOnBlockAfterDriveRush(0)
            ->setOnPerfectParry(0)
            ->setDriveDamageOnHit(0)
            ->setDriveDamageOnBlock(0)
            ->setDriveGain(0)
            ->setOnHitSelfSuperMeterGain(0)
            ->setOnBlockSelfSuperMeterGain(0)
            ->setOnHitOpponentSuperMeterGain(0)
            ->setOnBlockOpponentSuperMeterGain(0)
            ->setHitConfirmSpecialsAndSupers(0)
            ->setHitConfirmTargetCombos(0)
            ->setJuggleLimit(0)
            ->setJuggleIncrease(0)
            ->setJuggleStart(0)
            ->setHitstun(0)
            ->setBlockstun(0)
            ->setHitstop(0)
            ->setExtraInformation('[]');
        $frameData->applyEffectiveOverrides(['damage' => 900]);

        $applier = new FrameDataRecordApplier(new FrameDataScalingNormalizerService());
        $changed = $applier->applyFatRecord($frameData, [
            'startup' => 6,
            'active' => 3,
            'recovery' => 16,
            'total' => 24,
            'onHit' => 2,
            'onBlock' => -1,
            'onPC' => 4,
            'moveType' => 'normal',
            'xx' => [],
            'dmg' => 700,
            'dmgScaling' => null,
            'chp' => 0,
            'atkLvl' => '2',
            'extraInfo' => [],
        ]);

        self::assertFalse($changed);
        self::assertSame(900, $frameData->getDamage());
        self::assertSame(700, $frameData->getRawValue('damage'));
    }

    public function testItStoresPlainNumericSpacing(): void
    {
        self::assertSame(1.545, $this->applySpacing(1.545)->getSpacing());
    }

    public function testItStoresTheLargestNumberOfRangedSpacing(): void
    {
        self::assertSame(1.736, $this->applySpacing('1.548~1.736')->getSpacing());
    }

    public function testItStoresTheLargestNumberAcrossSpacingVariants(): void
    {
        self::assertSame(1.71, $this->applySpacing('0.89~1.18 / 1.71')->getSpacing());
        self::assertSame(1.863, $this->applySpacing('1.863 Fwd / 0.767 Back')->getSpacing());
    }

    public function testItLeavesSpacingEmptyWhenFatHasNoNumber(): void
    {
        self::assertNull($this->applySpacing('?')->getSpacing());
    }

    public function testItLeavesSpacingEmptyWhenFatHasNoRange(): void
    {
        self::assertNull($this->applySpacing(null)->getSpacing());
    }

    public function testItStoresTheFatMoveName(): void
    {
        $frameData = new FrameData();
        $applier = new FrameDataRecordApplier(new FrameDataScalingNormalizerService());

        $applier->applyFatRecord($frameData, ['moveType' => 'special', 'moveName' => '  HP Sonic Boom ']);
        self::assertSame('HP Sonic Boom', $frameData->getMoveName());

        $applier->applyFatRecord($frameData, ['moveType' => 'special', 'moveName' => '']);
        self::assertNull($frameData->getMoveName());
    }

    private function applySpacing(mixed $range): FrameData
    {
        $frameData = new FrameData();
        $record = ['moveType' => 'normal', 'dmg' => 600];
        if (null !== $range) {
            $record['range'] = $range;
        }

        (new FrameDataRecordApplier(new FrameDataScalingNormalizerService()))->applyFatRecord($frameData, $record);

        return $frameData;
    }
}
