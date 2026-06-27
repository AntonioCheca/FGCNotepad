<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ReplayClip;
use App\Entity\ReplayVideo;
use App\Entity\User;
use App\Repository\ReplayClipRepository;
use App\Repository\ReplayVideoRepository;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class ReplayLabLimits
{
    public function __construct(
        private readonly ReplayVideoRepository $videoRepository,
        private readonly ReplayClipRepository $clipRepository,
        private readonly int $maxReplaySizeBytes,
        private readonly int $maxReplayDurationSeconds,
        private readonly int $maxTemporaryReplaysPerUser,
        private readonly int $maxTemporaryReplayStorageBytesPerUser,
        private readonly int $maxClipDurationSeconds,
        private readonly int $maxClipsPerUser,
        private readonly int $maxClipStorageBytesPerUser,
    ) {
    }

    public function assertReplayUploadAllowed(User $owner, int $sizeBytes, int $durationMs): void
    {
        if ($sizeBytes > $this->maxReplaySizeBytes) {
            throw new BadRequestHttpException('Replay file exceeds the configured size limit.');
        }

        if ($durationMs > 0 && $durationMs > ($this->maxReplayDurationSeconds * 1000)) {
            throw new BadRequestHttpException('Replay duration exceeds the configured limit.');
        }

        $activeReplayCount = $this->countActiveReplays($owner);
        if ($activeReplayCount >= $this->maxTemporaryReplaysPerUser) {
            throw new BadRequestHttpException('Replay upload limit reached for this user.');
        }

        $activeStorageBytes = $this->sumActiveReplayStorage($owner);
        if (($activeStorageBytes + $sizeBytes) > $this->maxTemporaryReplayStorageBytesPerUser) {
            throw new BadRequestHttpException('Replay storage limit reached for this user.');
        }
    }

    public function assertClipAllowed(User $owner, int $sizeBytes, int $durationMs): void
    {
        if ($durationMs > ($this->maxClipDurationSeconds * 1000)) {
            throw new BadRequestHttpException('Replay clip exceeds the configured duration limit.');
        }

        $activeClipCount = $this->countActiveClips($owner);
        if ($activeClipCount >= $this->maxClipsPerUser) {
            throw new BadRequestHttpException('Replay clip limit reached for this user.');
        }

        $activeClipStorageBytes = $this->sumActiveClipStorage($owner);
        if (($activeClipStorageBytes + $sizeBytes) > $this->maxClipStorageBytesPerUser) {
            throw new BadRequestHttpException('Replay clip storage limit reached for this user.');
        }
    }

    /**
     * @return array<string, int>
     */
    public function toArray(): array
    {
        return [
            'maxReplaySizeBytes' => $this->maxReplaySizeBytes,
            'maxReplayDurationSeconds' => $this->maxReplayDurationSeconds,
            'maxTemporaryReplaysPerUser' => $this->maxTemporaryReplaysPerUser,
            'maxTemporaryReplayStorageBytesPerUser' => $this->maxTemporaryReplayStorageBytesPerUser,
            'maxClipDurationSeconds' => $this->maxClipDurationSeconds,
            'maxClipsPerUser' => $this->maxClipsPerUser,
            'maxClipStorageBytesPerUser' => $this->maxClipStorageBytesPerUser,
        ];
    }

    private function countActiveReplays(User $owner): int
    {
        return (int) $this->videoRepository->createQueryBuilder('video')
            ->select('COUNT(video.id)')
            ->andWhere('video.ownerUser = :owner')
            ->andWhere('video.status NOT IN (:terminalStatuses)')
            ->setParameter('owner', $owner)
            ->setParameter('terminalStatuses', [ReplayVideo::STATUS_DELETED, ReplayVideo::STATUS_EXPIRED])
            ->getQuery()
            ->getSingleScalarResult();
    }

    private function sumActiveReplayStorage(User $owner): int
    {
        return (int) ($this->videoRepository->createQueryBuilder('video')
            ->select('COALESCE(SUM(video.sizeBytes), 0)')
            ->andWhere('video.ownerUser = :owner')
            ->andWhere('video.status NOT IN (:terminalStatuses)')
            ->setParameter('owner', $owner)
            ->setParameter('terminalStatuses', [ReplayVideo::STATUS_DELETED, ReplayVideo::STATUS_EXPIRED])
            ->getQuery()
            ->getSingleScalarResult() ?? 0);
    }

    private function countActiveClips(User $owner): int
    {
        return (int) $this->clipRepository->createQueryBuilder('clip')
            ->select('COUNT(clip.id)')
            ->andWhere('clip.ownerUser = :owner')
            ->andWhere('clip.status != :deletedStatus')
            ->setParameter('owner', $owner)
            ->setParameter('deletedStatus', ReplayClip::STATUS_DELETED)
            ->getQuery()
            ->getSingleScalarResult();
    }

    private function sumActiveClipStorage(User $owner): int
    {
        return (int) ($this->clipRepository->createQueryBuilder('clip')
            ->select('COALESCE(SUM(clip.sizeBytes), 0)')
            ->andWhere('clip.ownerUser = :owner')
            ->andWhere('clip.status != :deletedStatus')
            ->setParameter('owner', $owner)
            ->setParameter('deletedStatus', ReplayClip::STATUS_DELETED)
            ->getQuery()
            ->getSingleScalarResult() ?? 0);
    }
}
