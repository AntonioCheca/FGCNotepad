<?php declare(strict_types=1);

namespace App\Service\ReplayStorage;

final readonly class StoredVideoObject
{
    public function __construct(
        private string $storageKey,
        private string $mimeType,
        private int $sizeBytes,
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
}
