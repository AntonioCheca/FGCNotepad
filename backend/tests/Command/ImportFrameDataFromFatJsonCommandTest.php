<?php declare(strict_types=1);

namespace App\Tests\Command;

use App\Command\ImportFrameDataFromFatJsonCommand;
use App\Entity\Character;
use App\Entity\FrameData;
use App\Entity\Move;
use App\Repository\CharacterRepository;
use App\Repository\MoveRepository;
use App\Service\FrameDataScalingNormalizerService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Tester\CommandTester;

final class ImportFrameDataFromFatJsonCommandTest extends TestCase
{
    public function testItShowsScalingWarningsAndContinuesImport(): void
    {
        $tempDir = sys_get_temp_dir() . '/fat_import_' . uniqid();
        mkdir($tempDir);
        mkdir($tempDir . '/data');

        $payload = [
            'Ryu' => [
                'moves' => [
                    'normal' => [
                        'Test Move' => [
                            'numCmd' => '5MP',
                            'startup' => 6,
                            'active' => 3,
                            'recovery' => 16,
                            'total' => 24,
                            'onHit' => 2,
                            'onBlock' => -1,
                            'onPC' => 4,
                            'moveType' => 'normal',
                            'xx' => [],
                            'dmg' => 600,
                            'dmgScaling' => '50% Minimum / 10% Immediate (special)',
                            'chp' => 0,
                            'atkLvl' => '2',
                            'extraInfo' => [],
                        ],
                    ],
                ],
            ],
        ];

        file_put_contents($tempDir . '/data/fat_data.json', (string) json_encode($payload));

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects(self::atLeastOnce())->method('persist');
        $entityManager->expects(self::once())->method('flush');

        $characterRepository = $this->createMock(CharacterRepository::class);
        $characterRepository->method('findOneBy')->willReturn(null);

        $moveRepository = $this->createMock(MoveRepository::class);
        $moveRepository->method('findOneBy')->willReturn(null);

        $command = new ImportFrameDataFromFatJsonCommand(
            entityManager: $entityManager,
            projectDir: $tempDir,
            moveRepository: $moveRepository,
            characterRepository: $characterRepository,
            scalingNormalizer: new FrameDataScalingNormalizerService(),
        );

        $tester = new CommandTester($command);
        $status = $tester->execute([]);

        self::assertSame(0, $status);
        self::assertStringContainsString('Scaling parse warning [Ryu - Test Move]', $tester->getDisplay());
        self::assertStringContainsString('Imported 1 moves into the database.', $tester->getDisplay());

        unlink($tempDir . '/data/fat_data.json');
        rmdir($tempDir . '/data');
        rmdir($tempDir);
    }

    public function testItImportsCompositeDamageTotalFromFatDamageString(): void
    {
        $tempDir = sys_get_temp_dir() . '/fat_import_' . uniqid();
        mkdir($tempDir);
        mkdir($tempDir . '/data');

        $payload = [
            'Akuma' => [
                'moves' => [
                    'normal' => [
                        'TC 2' => [
                            'numCmd' => '5MP > MP',
                            'startup' => 6,
                            'active' => 3,
                            'recovery' => 16,
                            'total' => 24,
                            'onHit' => 2,
                            'onBlock' => -1,
                            'onPC' => 4,
                            'moveType' => 'normal',
                            'xx' => ['sp', 'su'],
                            'fullDmg' => '1300 (600*700)',
                            'dmg' => 700,
                            'dmgScaling' => null,
                            'chp' => 0,
                            'atkLvl' => '2',
                            'extraInfo' => [],
                        ],
                    ],
                ],
            ],
        ];

        file_put_contents($tempDir . '/data/fat_data.json', (string) json_encode($payload));

        $persistedFrameData = [];
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->method('persist')->willReturnCallback(static function (object $entity) use (&$persistedFrameData): void {
            if ($entity instanceof FrameData) {
                $persistedFrameData[] = $entity;
            }
        });
        $entityManager->expects(self::once())->method('flush');

        $characterRepository = $this->createMock(CharacterRepository::class);
        $characterRepository->method('findOneBy')->willReturn(null);

        $moveRepository = $this->createMock(MoveRepository::class);
        $moveRepository->method('findOneBy')->willReturn(null);

        $command = new ImportFrameDataFromFatJsonCommand(
            entityManager: $entityManager,
            projectDir: $tempDir,
            moveRepository: $moveRepository,
            characterRepository: $characterRepository,
            scalingNormalizer: new FrameDataScalingNormalizerService(),
        );

        $tester = new CommandTester($command);
        $status = $tester->execute([]);

        self::assertSame(0, $status);
        self::assertCount(1, $persistedFrameData);
        self::assertSame(1300, $persistedFrameData[0]->getDamage());

        unlink($tempDir . '/data/fat_data.json');
        rmdir($tempDir . '/data');
        rmdir($tempDir);
    }

    public function testItUpdatesExistingFrameDataWithoutReplacingIt(): void
    {
        $tempDir = sys_get_temp_dir() . '/fat_import_' . uniqid();
        mkdir($tempDir);
        mkdir($tempDir . '/data');

        $payload = [
            'Akuma' => [
                'moves' => [
                    'normal' => [
                        'TC 2' => [
                            'numCmd' => '5MP > MP',
                            'startup' => 6,
                            'active' => 3,
                            'recovery' => 16,
                            'total' => 24,
                            'onHit' => 2,
                            'onBlock' => -1,
                            'onPC' => 4,
                            'moveType' => 'normal',
                            'xx' => ['sp', 'su'],
                            'fullDmg' => '1300 (600*700)',
                            'dmg' => 700,
                            'dmgScaling' => null,
                            'chp' => 0,
                            'atkLvl' => '2',
                            'extraInfo' => [],
                        ],
                    ],
                ],
            ],
        ];

        file_put_contents($tempDir . '/data/fat_data.json', (string) json_encode($payload));

        $character = (new Character())->setName('Akuma')->setLife(9000);
        $frameData = (new FrameData())->setDamage(700);
        $move = (new Move())
            ->setNumpadNotation('5MP > MP')
            ->setCharacter($character)
            ->setFrameData($frameData);

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects(self::once())->method('persist')->with($frameData);
        $entityManager->expects(self::once())->method('flush');

        $characterRepository = $this->createMock(CharacterRepository::class);
        $characterRepository->method('findOneBy')->willReturn($character);

        $moveRepository = $this->createMock(MoveRepository::class);
        $moveRepository->method('findOneBy')->willReturn($move);

        $command = new ImportFrameDataFromFatJsonCommand(
            entityManager: $entityManager,
            projectDir: $tempDir,
            moveRepository: $moveRepository,
            characterRepository: $characterRepository,
            scalingNormalizer: new FrameDataScalingNormalizerService(),
        );

        $tester = new CommandTester($command);
        $status = $tester->execute([]);

        self::assertSame(0, $status);
        self::assertSame($frameData, $move->getFrameData());
        self::assertSame(1300, $frameData->getDamage());
        self::assertStringContainsString('Existing moves updated due to differences: 1.', $tester->getDisplay());

        unlink($tempDir . '/data/fat_data.json');
        rmdir($tempDir . '/data');
        rmdir($tempDir);
    }
}
