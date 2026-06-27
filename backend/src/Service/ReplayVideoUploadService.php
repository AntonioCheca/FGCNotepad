<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ReplayVideo;
use App\Entity\User;
use App\Service\ReplayStorage\VideoStorageInterface;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class ReplayVideoUploadService
{
    /**
     * @var list<string>
     */
    private const ALLOWED_MIME_TYPES = [
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'video/x-matroska',
        'video/matroska',
    ];

    public function __construct(
        private readonly VideoStorageInterface $storage,
        private readonly EntityManagerInterface $entityManager,
        private readonly ReplayLabLimits $limits,
        private readonly int $retentionDays,
    ) {
    }

    public function upload(User $owner, UploadedFile $file, ?float $fps): ReplayVideo
    {
        $this->validate($file, $fps);

        $mimeType = $this->resolveMimeType($file);
        $sizeBytes = $file->getSize();
        if (null === $sizeBytes) {
            throw new BadRequestHttpException('Could not read uploaded file size.');
        }
        $this->limits->assertReplayUploadAllowed($owner, $sizeBytes, 0);

        $storageKey = $this->buildReplayStorageKey($owner, $file);
        $storedObject = $this->storage->store($storageKey, $file->getPathname(), $mimeType);

        $video = (new ReplayVideo())
            ->setOwnerUser($owner)
            ->setSourceType(ReplayVideo::SOURCE_TYPE_UPLOAD)
            ->setOriginalFilename($file->getClientOriginalName())
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

    private function validate(UploadedFile $file, ?float $fps): void
    {
        if (!$file->isValid()) {
            throw new BadRequestHttpException('Replay upload failed.');
        }

        $sizeBytes = $file->getSize();
        if (null === $sizeBytes || $sizeBytes <= 0) {
            throw new BadRequestHttpException('Replay file is empty.');
        }

        $mimeType = $this->resolveMimeType($file);
        if (!in_array($mimeType, self::ALLOWED_MIME_TYPES, true)) {
            throw new BadRequestHttpException('Replay file type is not supported.');
        }

        if (null !== $fps && ($fps <= 0.0 || $fps > 240.0)) {
            throw new BadRequestHttpException('fps must be greater than 0 and no more than 240.');
        }
    }

    private function buildReplayStorageKey(User $owner, UploadedFile $file): string
    {
        $userId = (string) $owner->getId();
        if ('' === $userId) {
            throw new \LogicException('Replay owner must be persisted before upload.');
        }

        $extension = strtolower($file->getClientOriginalExtension() ?: 'mp4');
        if (!preg_match('/^[a-z0-9]+$/', $extension)) {
            $extension = 'mp4';
        }

        return sprintf('replays/%s/%s/original.%s', $userId, bin2hex(random_bytes(16)), $extension);
    }

    private function resolveMimeType(UploadedFile $file): string
    {
        try {
            $mimeType = $file->getMimeType();
        } catch (\Throwable) {
            $mimeType = null;
        }

        $mimeType ??= $file->getClientMimeType();
        if (in_array($mimeType, ['application/octet-stream', 'binary/octet-stream'], true)) {
            return $this->mimeTypeFromExtension($file->getClientOriginalExtension()) ?? $mimeType;
        }

        return $mimeType;
    }

    private function mimeTypeFromExtension(string $extension): ?string
    {
        return match (strtolower($extension)) {
            'mp4', 'm4v' => 'video/mp4',
            'webm' => 'video/webm',
            'mov', 'qt' => 'video/quicktime',
            'mkv' => 'video/x-matroska',
            default => null,
        };
    }
}
