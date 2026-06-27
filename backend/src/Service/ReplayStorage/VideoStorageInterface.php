<?php declare(strict_types=1);

namespace App\Service\ReplayStorage;

interface VideoStorageInterface
{
    public function store(string $storageKey, string $sourcePath, string $mimeType): StoredVideoObject;

    public function exists(string $storageKey): bool;

    public function delete(string $storageKey): void;
}
