<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ReplayVideo;
use App\Entity\User;
use App\Service\ReplayStorage\StoredVideoObject;
use App\Service\ReplayStorage\VideoStorageInterface;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class LocalReplayImportService
{
    /** @var array<string, string> */
    private const ALLOWED_EXTENSIONS = [
        'mp4' => 'video/mp4',
        'm4v' => 'video/mp4',
        'webm' => 'video/webm',
        'mov' => 'video/quicktime',
        'qt' => 'video/quicktime',
        'mkv' => 'video/x-matroska',
    ];

    public function __construct(
        private readonly string $importDirectory,
        private readonly VideoStorageInterface $storage,
        private readonly ReplayLabLimits $limits,
        private readonly EntityManagerInterface $entityManager,
        private readonly int $retentionDays,
    ) {
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listImportableFiles(): array
    {
        $directory = $this->normalizedImportDirectory();
        if (!is_dir($directory)) {
            if (!mkdir($directory, 0775, true) && !is_dir($directory)) {
                throw new \RuntimeException(sprintf('Could not create replay import directory "%s".', $directory));
            }
        }

        $files = [];
        foreach (new \DirectoryIterator($directory) as $file) {
            if (!$file->isFile() || !$file->isReadable()) {
                continue;
            }

            $extension = strtolower($file->getExtension());
            if (!array_key_exists($extension, self::ALLOWED_EXTENSIONS)) {
                continue;
            }

            $files[] = [
                'id' => $this->encodeFileId($file->getFilename()),
                'filename' => $file->getFilename(),
                'sizeBytes' => $file->getSize(),
                'mimeType' => self::ALLOWED_EXTENSIONS[$extension],
                'modifiedAt' => (new \DateTimeImmutable())->setTimestamp($file->getMTime())->format(\DateTimeInterface::ATOM),
            ];
        }

        usort($files, fn (array $left, array $right): int => strcmp((string) $right['modifiedAt'], (string) $left['modifiedAt']));

        return $files;
    }

    public function import(User $owner, string $fileId, ?float $fps, bool $deleteSource = false): ReplayVideo
    {
        if (null !== $fps && ($fps <= 0.0 || $fps > 240.0)) {
            throw new BadRequestHttpException('fps must be greater than 0 and no more than 240.');
        }

        $filename = $this->decodeFileId($fileId);
        $sourcePath = $this->resolveImportPath($filename);
        if (!is_file($sourcePath) || !is_readable($sourcePath)) {
            throw new NotFoundHttpException('Replay import file not found.');
        }

        $extension = strtolower(pathinfo($sourcePath, PATHINFO_EXTENSION));
        $mimeType = self::ALLOWED_EXTENSIONS[$extension] ?? null;
        if (null === $mimeType) {
            throw new BadRequestHttpException('Replay import file type is not supported.');
        }

        $sizeBytes = filesize($sourcePath);
        if (false === $sizeBytes || $sizeBytes <= 0) {
            throw new BadRequestHttpException('Replay import file is empty.');
        }

        $this->limits->assertReplayUploadAllowed($owner, $sizeBytes, 0);
        $storedObject = $this->storeImportFile($owner, $sourcePath, $filename, $mimeType, $deleteSource);

        $video = (new ReplayVideo())
            ->setOwnerUser($owner)
            ->setSourceType(ReplayVideo::SOURCE_TYPE_LOCAL_IMPORT)
            ->setOriginalFilename($filename)
            ->setStorageKey($storedObject->getStorageKey())
            ->setMimeType($storedObject->getMimeType())
            ->setSizeBytes($storedObject->getSizeBytes())
            ->setDurationMs(0)
            ->setFps($fps ?? 60.0)
            ->setStatus(ReplayVideo::STATUS_READY)
            ->setDeleteAfter((new \DateTimeImmutable())->modify(sprintf('+%d days', $this->retentionDays)));

        $this->entityManager->persist($video);
        $this->entityManager->flush();

        return $video;
    }

    private function storeImportFile(User $owner, string $sourcePath, string $filename, string $mimeType, bool $deleteSource): StoredVideoObject
    {
        $storageKey = $this->buildStorageKey($owner, $filename);
        if (!$deleteSource) {
            return $this->storage->store($storageKey, $sourcePath, $mimeType);
        }

        $storedObject = $this->storage->store($storageKey, $sourcePath, $mimeType);
        if (!unlink($sourcePath)) {
            throw new \RuntimeException(sprintf('Imported replay but could not delete source file "%s".', $filename));
        }

        return $storedObject;
    }

    private function buildStorageKey(User $owner, string $filename): string
    {
        $userId = (string) $owner->getId();
        if ('' === $userId) {
            throw new \LogicException('Replay owner must be persisted before import.');
        }

        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

        return sprintf('replays/%s/%s/original.%s', $userId, bin2hex(random_bytes(16)), $extension);
    }

    private function resolveImportPath(string $filename): string
    {
        $directory = $this->normalizedImportDirectory();
        $path = $directory . DIRECTORY_SEPARATOR . $filename;
        $realDirectory = realpath($directory);
        $realPath = realpath($path);
        if (false === $realDirectory || false === $realPath || !str_starts_with($realPath, $realDirectory . DIRECTORY_SEPARATOR)) {
            throw new BadRequestHttpException('Replay import path is invalid.');
        }

        return $realPath;
    }

    private function normalizedImportDirectory(): string
    {
        return rtrim($this->importDirectory, DIRECTORY_SEPARATOR . '/');
    }

    private function encodeFileId(string $filename): string
    {
        return rtrim(strtr(base64_encode($filename), '+/', '-_'), '=');
    }

    private function decodeFileId(string $fileId): string
    {
        $decoded = base64_decode(strtr($fileId, '-_', '+/'), true);
        if (!is_string($decoded) || '' === $decoded || basename($decoded) !== $decoded) {
            throw new BadRequestHttpException('Replay import file id is invalid.');
        }

        return $decoded;
    }
}
