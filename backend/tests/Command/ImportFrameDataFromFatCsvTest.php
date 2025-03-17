<?php declare(strict_types=1);

namespace App\Tests\Command;

use App\Entity\Character;
use App\Entity\Move;
use App\Entity\FrameData;
use App\Tests\DatabaseTestCase;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Console\Tester\CommandTester;
use Symfony\Component\Console\Application;
use App\Command\ImportFrameDataFromFatCsvCommand;
use Doctrine\ORM\EntityManagerInterface;

class ImportFrameDataFromFatCsvTest extends DatabaseTestCase
{
    private string $testCsvPath;

    protected function setUp(): void
    {
        parent::setUp();

        $this->testCsvPath = sys_get_temp_dir() . '/test_frame_data.csv';
        file_put_contents($this->testCsvPath, "numCmd,startup,active,recovery,total,onHit,onBlock,moveType,xx,dmg\n236P,5,3,20,28,2,-4,special,sp,80");
    }

    protected function tearDown(): void
    {
        parent::tearDown();

        unlink($this->testCsvPath); // Clean up test CSV file
    }

    public function testImportFrameDataCommand(): void
    {
        $application = new Application();
        $command = self::getContainer()->get(ImportFrameDataFromFatCsvCommand::class);
        $application->add($command);

        $commandTester = new CommandTester($command);
        $commandTester->execute([
            'character' => 'TestCharacter',
            'file' => $this->testCsvPath,
        ]);

        $commandTester->assertCommandIsSuccessful();

        // Verify character was created
        $character = $this->entityManager->getRepository(Character::class)->findOneBy(['name' => 'TestCharacter']);
        $this->assertNotNull($character, 'Character should be created');

        // Verify move was created
        $move = $this->entityManager->getRepository(Move::class)->findOneBy(['numpadNotation' => '236P']);
        $this->assertNotNull($move, 'Move should be created');
        $this->assertEquals('236P', $move->getNumpadNotation(), 'Move numpad notation should match');

        // Verify frame data was created
        $frameData = $move->getFrameData();
        $this->assertNotNull($frameData, 'FrameData should be created');
        $this->assertEquals(5, $frameData->getStartup(), 'Startup frames should match');
        $this->assertEquals(80, $frameData->getDamage(), 'Damage value should match');
    }
}
