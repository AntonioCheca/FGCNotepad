<?php declare(strict_types=1);

namespace App\Service;

class FATFrameDataDownloader
{
    private const REMOTE_URL = 'https://raw.githubusercontent.com/D4RKONION/FAT/refs/heads/main/src/js/constants/framedata/SF6FrameData.json';

    public function download(): ?string
    {
        return file_get_contents(self::REMOTE_URL) ?: null;
    }
}
