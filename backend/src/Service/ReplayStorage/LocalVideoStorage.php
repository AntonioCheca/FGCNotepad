<?php declare(strict_types=1);

namespace App\Service\ReplayStorage;

final class LocalVideoStorage implements VideoStorageInterface, LocalVideoPathResolver
{
    public function __construct(
        private readonly string $rootDirectory,
    ) {
    }

    public function store(string $storageKey, string $sourcePath, string $mimeType): StoredVideoObject
    {
        if (!is_file($sourcePath) || !is_readable($sourcePath)) {
            throw new \RuntimeException(sprintf('Source file "%s" is not readable.', $sourcePath));
        }

        $targetPath = $this->resolvePath($storageKey);
        $targetDirectory = dirname($targetPath);
        if (!is_dir($targetDirectory) && !mkdir($targetDirectory, 0775, true) && !is_dir($targetDirectory)) {
            throw new \RuntimeException(sprintf('Could not create storage directory "%s".', $targetDirectory));
        }

        if (!copy($sourcePath, $targetPath)) {
            throw new \RuntimeException(sprintf('Could not store video object "%s".', $storageKey));
        }

        $sizeBytes = filesize($targetPath);
        if (false === $sizeBytes) {
            throw new \RuntimeException(sprintf('Could not read stored file size for "%s".', $storageKey));
        }

        return new StoredVideoObject($storageKey, $mimeType, $sizeBytes);
    }

    public function exists(string $storageKey): bool
    {
        return is_file($this->resolvePath($storageKey));
    }

    public function delete(string $storageKey): void
    {
        $path = $this->resolvePath($storageKey);
        if (is_file($path) && !unlink($path)) {
            throw new \RuntimeException(sprintf('Could not delete video object "%s".', $storageKey));
        }
    }

    public function resolvePath(string $storageKey): string
    {
        $normalizedKey = $this->normalizeStorageKey($storageKey);

        return rtrim($this->rootDirectory, DIRECTORY_SEPARATOR . '/') . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $normalizedKey);
    }

    private function normalizeStorageKey(string $storageKey): string
    {
        $rawKey = trim($storageKey);
        if (str_starts_with($rawKey, '/') || str_starts_with($rawKey, '\\')) {
            throw new \InvalidArgumentException('Storage key must be relative and cannot contain parent directory segments.');
        }

        $normalizedKey = trim(str_replace('\\', '/', $rawKey), '/');

        if ('' === $normalizedKey || str_contains($normalizedKey, '../') || str_contains($normalizedKey, '/..')) {
            throw new \InvalidArgumentException('Storage key must be relative and cannot contain parent directory segments.');
        }

        if (!preg_match('/^[A-Za-z0-9][A-Za-z0-9._\/-]*$/', $normalizedKey)) {
            throw new \InvalidArgumentException('Storage key contains unsupported characters.');
        }

        return $normalizedKey;
    }
}
