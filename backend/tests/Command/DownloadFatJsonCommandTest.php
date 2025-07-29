<?php declare(strict_types=1);

namespace App\Tests\Command;

use App\Command\DownloadFrameDataFromFatJsonCommand;
use App\Service\FATFrameDataDownloader;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Tester\CommandTester;

class DownloadFatJsonCommandTest extends TestCase
{
    public function testItDownloadsAndWritesJsonToFile(): void
    {
        $mockJson = '{"Ryu": [{"numCmd": "5LP", "startup": 4}]}';

        // Fake downloader service
        $downloader = $this->createMock(FATFrameDataDownloader::class);
        $downloader->expects($this->once())
            ->method('download')
            ->willReturn($mockJson);

        // Use a temp directory for the test
        $tempDir = sys_get_temp_dir() . '/fat_test_' . uniqid();
        mkdir($tempDir);

        $command = new DownloadFrameDataFromFatJsonCommand($downloader, $tempDir);
        $tester = new CommandTester($command);
        $statusCode = $tester->execute([]);

        $this->assertSame(0, $statusCode);

        $expectedFile = $tempDir . '/data/fat_data.json';
        $this->assertFileExists($expectedFile);

        $contents = file_get_contents($expectedFile);
        $this->assertSame($mockJson, $contents);

        // Cleanup
        unlink($expectedFile);
        rmdir($tempDir . '/data');
        rmdir($tempDir);
    }
}
