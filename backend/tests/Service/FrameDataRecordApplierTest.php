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
}
