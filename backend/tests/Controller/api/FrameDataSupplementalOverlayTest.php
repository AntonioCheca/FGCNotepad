<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\FrameData;
use App\Entity\FrameDataImportBatch;
use App\Entity\FrameDataOverride;
use App\Entity\FrameDataSupplementalValue;
use App\Entity\Move;
use App\Repository\MoveRepository;
use App\Tests\DatabaseTestCase;

final class FrameDataSupplementalOverlayTest extends DatabaseTestCase
{
    public function testSupplementalValueAppliesBeforeManualOverride(): void
    {
        $character = (new Character())->setName('Ryu');
        $frameData = (new FrameData())
            ->setMoveType('normal')
            ->setCancelsTo('[]')
            ->setDamage(700)
            ->setDriveGain(100);
        $move = (new Move())->setCharacter($character)->setNumpadNotation('5HP')->setFrameData($frameData);
        $batch = (new FrameDataImportBatch())->setSourceType(FrameDataImportBatch::SOURCE_SUPPLEMENTAL)->setLabel('test-patch');
        $supplemental = (new FrameDataSupplementalValue())->setImportBatch($batch)->setMove($move);
        $supplemental->setValue('damage', 800);
        $override = (new FrameDataOverride())->setFrameData($frameData)->setColumnName('damage')->setOverrideValue(850);

        $this->entityManager->persist($character);
        $this->entityManager->persist($frameData);
        $this->entityManager->persist($move);
        $this->entityManager->persist($batch);
        $this->entityManager->persist($supplemental);
        $this->entityManager->persist($override);
        $this->entityManager->flush();
        $this->entityManager->clear();

        $repository = static::getContainer()->get(MoveRepository::class);
        $persisted = $repository->findWithEffectiveFrameData($move->getId()?->toRfc4122());

        self::assertInstanceOf(Move::class, $persisted);
        self::assertInstanceOf(FrameData::class, $persisted->getFrameData());
        self::assertSame(850, $persisted->getFrameData()->getDamage());
        self::assertSame(700, $persisted->getFrameData()->getRawValue('damage'));
    }
}
