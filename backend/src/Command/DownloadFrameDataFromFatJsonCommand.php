<?php declare(strict_types=1);

namespace App\Command;

use App\Service\FATFrameDataDownloader;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'frame-data:download:fat-json',
    description: 'Download the latest FAT JSON frame data from GitHub'
)]
class DownloadFrameDataFromFatJsonCommand extends Command
{
    private FATFrameDataDownloader $downloader;
    private string $projectDir;

    public function __construct(FATFrameDataDownloader $downloader, string $projectDir)
    {
        parent::__construct();
        $this->downloader = $downloader;
        $this->projectDir = $projectDir;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $output->writeln('<info>Downloading FAT frame data JSON...</info>');

        try {
            $jsonData = $this->downloader->download();

            if ($jsonData === null) {
                $output->writeln('<error>Failed to download data from GitHub.</error>');
                return Command::FAILURE;
            }

            $destinationDir = $this->projectDir . '/data';
            if (!is_dir($destinationDir)) {
                if (!mkdir($destinationDir, 0775, true) && !is_dir($destinationDir)) {
                    $output->writeln('<error>Failed to create destination directory: ' . $destinationDir . '</error>');
                    return Command::FAILURE;
                }
            }

            $filePath = $destinationDir . '/fat_data.json';
            $result = file_put_contents($filePath, $jsonData);

            if ($result === false) {
                $output->writeln("<error>Failed to save file to: $filePath</error>");
                return Command::FAILURE;
            }

            $output->writeln("<info>Successfully downloaded frame data to: $filePath</info>");
            return Command::SUCCESS;

        } catch (\Throwable $e) {
            $output->writeln('<error>Unexpected error: ' . $e->getMessage() . '</error>');
            return Command::FAILURE;
        }
    }
}
