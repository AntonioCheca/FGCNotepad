<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ReplayVideo;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class ReplayVideoSourceService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    public function createYouTubeVideo(User $owner, string $urlOrVideoId, ?string $title, ?float $fps): ReplayVideo
    {
        $videoId = $this->extractYouTubeVideoId($urlOrVideoId);
        if (null === $videoId) {
            throw new BadRequestHttpException('youtubeUrl must be a valid YouTube URL or video ID.');
        }

        if (null !== $fps && ($fps <= 0.0 || $fps > 240.0)) {
            throw new BadRequestHttpException('fps must be greater than 0 and no more than 240.');
        }

        $displayTitle = trim((string) $title);
        $video = (new ReplayVideo())
            ->setOwnerUser($owner)
            ->setSourceType(ReplayVideo::SOURCE_TYPE_YOUTUBE)
            ->setOriginalFilename('' !== $displayTitle ? $displayTitle : sprintf('YouTube %s', $videoId))
            ->setStorageKey('')
            ->setYoutubeVideoId($videoId)
            ->setYoutubeUrl(sprintf('https://www.youtube.com/watch?v=%s', $videoId))
            ->setMimeType('video/youtube')
            ->setSizeBytes(0)
            ->setDurationMs(0)
            ->setFps($fps ?? 60.0)
            ->setStatus(ReplayVideo::STATUS_READY)
            ->setDeleteAfter(null);

        $this->entityManager->persist($video);
        $this->entityManager->flush();

        return $video;
    }

    public function createLocalFileVideo(User $owner, string $filename, int $sizeBytes, ?float $fps): ReplayVideo
    {
        $trimmedFilename = trim($filename);
        if ('' === $trimmedFilename) {
            throw new BadRequestHttpException('filename is required.');
        }

        if ($sizeBytes <= 0) {
            throw new BadRequestHttpException('sizeBytes must be greater than 0.');
        }

        if (null !== $fps && ($fps <= 0.0 || $fps > 240.0)) {
            throw new BadRequestHttpException('fps must be greater than 0 and no more than 240.');
        }

        $video = (new ReplayVideo())
            ->setOwnerUser($owner)
            ->setSourceType(ReplayVideo::SOURCE_TYPE_LOCAL_FILE)
            ->setOriginalFilename(mb_substr($trimmedFilename, 0, 255))
            ->setStorageKey('')
            ->setMimeType('video/local-file')
            ->setSizeBytes($sizeBytes)
            ->setDurationMs(0)
            ->setFps($fps ?? 60.0)
            ->setStatus(ReplayVideo::STATUS_READY)
            ->setDeleteAfter(null);

        $this->entityManager->persist($video);
        $this->entityManager->flush();

        return $video;
    }

    private function extractYouTubeVideoId(string $value): ?string
    {
        $trimmed = trim($value);
        if (preg_match('/^[A-Za-z0-9_-]{11}$/', $trimmed)) {
            return $trimmed;
        }

        $parts = parse_url($trimmed);
        if (!is_array($parts)) {
            return null;
        }

        $host = strtolower((string) ($parts['host'] ?? ''));
        if ('youtu.be' === $host) {
            $path = trim((string) ($parts['path'] ?? ''), '/');
            return preg_match('/^[A-Za-z0-9_-]{11}$/', $path) ? $path : null;
        }

        if (!str_ends_with($host, 'youtube.com')) {
            return null;
        }

        parse_str((string) ($parts['query'] ?? ''), $query);
        $queryVideoId = $query['v'] ?? null;
        if (is_string($queryVideoId) && preg_match('/^[A-Za-z0-9_-]{11}$/', $queryVideoId)) {
            return $queryVideoId;
        }

        if (preg_match('#/(embed|shorts)/([A-Za-z0-9_-]{11})#', (string) ($parts['path'] ?? ''), $matches)) {
            return $matches[2];
        }

        return null;
    }
}
