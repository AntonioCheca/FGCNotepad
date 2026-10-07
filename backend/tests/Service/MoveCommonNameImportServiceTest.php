<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\Character;
use App\Entity\FrameData;
use App\Entity\Move;
use App\Service\MoveCommonNameImportService;
use App\Tests\DatabaseTestCase;

final class MoveCommonNameImportServiceTest extends DatabaseTestCase
{
    public function testCopiesCommonNamesWithoutTouchingFrameDataOrNamelessMoves(): void
    {
        $akuma = (new Character())->setName('Akuma');
        $frameData = (new FrameData())->setOnHit(41);
        $tatsu = (new Move())->setCharacter($akuma)->setNumpadNotation('214MK')->setFrameData($frameData);
        $dash = (new Move())->setCharacter($akuma)->setNumpadNotation('66')->setCommonName('Forward Dash');
        foreach ([$akuma, $frameData, $tatsu, $dash] as $entity) {
            $this->entityManager->persist($entity);
        }
        $this->entityManager->flush();

        $updated = static::getContainer()->get(MoveCommonNameImportService::class)->import([
            'Akuma' => ['moves' => ['normal' => [
                'MK Tatsumaki Zanku-kyaku' => ['numCmd' => '214MK', 'cmnName' => 'MK Tatsu', 'onHit' => 30],
                'Dash' => ['numCmd' => '66'],
                'Unknown move' => ['numCmd' => '623P', 'cmnName' => 'DP'],
            ]]],
            'Nobody' => ['moves' => ['normal' => [['numCmd' => '5LP', 'cmnName' => 'Jab']]]],
        ]);

        $this->entityManager->refresh($tatsu);
        $this->entityManager->refresh($dash);
        $this->assertSame(1, $updated);
        $this->assertSame('MK Tatsu', $tatsu->getCommonName());
        $this->assertSame(41, $tatsu->getFrameData()?->getOnHit());
        $this->assertSame('Forward Dash', $dash->getCommonName());
    }
}
