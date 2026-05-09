<?php declare(strict_types=1);

namespace App\Tests\Command;

use App\Command\ImportFrameDataFromFatJsonCommand;
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
}
