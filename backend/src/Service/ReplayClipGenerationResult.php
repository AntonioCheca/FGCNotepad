<?php declare(strict_types=1);

namespace App\Service;

final readonly class ReplayClipGenerationResult
{
    public function __construct(
        private string $storageKey,
        private string $mimeType,
        private int $sizeBytes,
        private int $durationMs,
    ) {
    }

    public function getStorageKey(): string
    {
        return $this->storageKey;
    }

    public function getMimeType(): string
    {
        return $this->mimeType;
    }

    public function getSizeBytes(): int
    {
        return $this->sizeBytes;
    }

    public function getDurationMs(): int
    {
        return $this->durationMs;
    }
}
