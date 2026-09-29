<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\Character;
use App\Entity\Move;
use App\Service\FrameDataVariantImportService;
use App\Tests\DatabaseTestCase;

final class FrameDataVariantImportServiceTest extends DatabaseTestCase
{
    /** @var array<string, mixed> */
    private array $fat = [
        'Test Fighter' => ['moves' => [
            'normal' => [
                'Palm' => ['numCmd' => '236MP', 'dmg' => '600(700)', 'moveType' => 'special', 'startup' => 12],
                'Split Palm' => ['numCmd' => '214PP', 'dmg' => '800 (400*400)', 'moveType' => 'special'],
                'Crouch LK' => ['numCmd' => '2LK', 'dmg' => 180, 'moveType' => 'normal', 'dmgScaling' => '20% Start'],
            ],
            'Buffed' => [
                'Crouch LK' => ['numCmd' => '2LK', 'dmg' => 199, 'moveType' => 'normal', 'dmgScaling' => '20% Start'],
                'Crouch HP' => ['numCmd' => '2HP', 'dmg' => 799, 'moveType' => 'normal'],
            ],
        ]],
        'Other Fighter' => ['moves' => ['normal' => []]],
    ];

    protected function setUp(): void
    {
        parent::setUp();

        $this->entityManager->persist((new Character())->setName('Test Fighter'));
        $this->entityManager->persist((new Character())->setName('Other Fighter'));
        $this->entityManager->flush();
    }

    public function testSectionAndAlternateRowsBecomeVariantMoves(): void
    {
        $result = $this->import("character,kind,source,target,note\n,section,Buffed,(install),\nTest Fighter,alternate,236MP,236MP (Toxic),poisoned\n");

        self::assertSame(3, $result->processed);
        self::assertSame(3, $result->movesCreated);
        self::assertSame(199, $this->damage('2LK (install)'));
        self::assertSame(799, $this->damage('2HP (install)'));
        self::assertSame(700, $this->damage('236MP (Toxic)'));
        self::assertSame('20% Start', $this->move('2LK (install)')->getFrameData()?->getScaling());
        self::assertSame(12, $this->move('236MP (Toxic)')->getFrameData()?->getStartup());
    }

    public function testReimportUpdatesVariantsInPlace(): void
    {
        $csv = "character,kind,source,target\nTest Fighter,alternate,236MP,236MP (Toxic)\n";
        $this->import($csv);
        $this->fat['Test Fighter']['moves']['normal']['Palm']['dmg'] = '600(750)';

        $result = $this->import($csv);

        self::assertSame(0, $result->movesCreated);
        self::assertSame(1, $result->frameDataUpdated);
        self::assertSame(750, $this->damage('236MP (Toxic)'));
    }

    public function testInvalidRowsRejectTheFileWithoutWriting(): void
    {
        try {
            $this->import("character,kind,source,target\nTest Fighter,alternate,214PP,214PP (big),\nTest Fighter,alternate,5HK,5HK (x)\n,section,Missing,(y)\nNobody,alternate,2LK,2LK (z)\n,fuzzy,a,b\n");
            self::fail('The import should have been rejected.');
        } catch (\InvalidArgumentException $exception) {
            self::assertStringContainsString('line 6: kind must be "section" or "alternate"', $exception->getMessage());
        }

        try {
            $this->import("character,kind,source,target\nTest Fighter,alternate,214PP,214PP (big)\nTest Fighter,alternate,5HK,5HK (x)\n,section,Missing,(y)\nNobody,alternate,2LK,2LK (z)\n");
            self::fail('The import should have been rejected.');
        } catch (\InvalidArgumentException $exception) {
            self::assertStringContainsString('4 invalid rows', $exception->getMessage());
            self::assertStringContainsString('line 2: "214PP" damage "800 (400*400)" has no single alternate value in parentheses.', $exception->getMessage());
            self::assertStringContainsString('line 3: No "5HK" move for Test Fighter.', $exception->getMessage());
            self::assertStringContainsString('line 4: FAT section "Missing" not found.', $exception->getMessage());
            self::assertStringContainsString('line 5: Character "Nobody" is not in the FAT file.', $exception->getMessage());
        }

        self::assertSame([], $this->entityManager->getRepository(Move::class)->findAll());
    }

    private function import(string $csv): \App\Service\FrameDataImportResult
    {
        $path = (string) tempnam(sys_get_temp_dir(), 'variants');
        file_put_contents($path, $csv);
        $result = static::getContainer()->get(FrameDataVariantImportService::class)->import($path, $this->fat);
        $this->entityManager->clear();

        return $result;
    }

    private function move(string $notation): Move
    {
        $move = $this->entityManager->getRepository(Move::class)->findOneBy(['numpadNotation' => $notation]);
        self::assertInstanceOf(Move::class, $move);

        return $move;
    }

    private function damage(string $notation): ?int
    {
        return $this->move($notation)->getFrameData()?->getDamage();
    }
}
