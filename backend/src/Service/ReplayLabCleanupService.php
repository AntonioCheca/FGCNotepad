<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ReplayClip;
use App\Entity\ReplayVideo;
use App\Repository\PracticeTaskRepository;
use App\Repository\ReplayClipRepository;
use App\Repository\ReplayVideoRepository;
use App\Repository\StudyCardRepository;
use App\Service\ReplayStorage\VideoStorageInterface;
use Doctrine\ORM\EntityManagerInterface;

final class ReplayLabCleanupService
{
    public function __construct(
        private readonly ReplayVideoRepository $videoRepository,
        private readonly ReplayClipRepository $clipRepository,
        private readonly PracticeTaskRepository $practiceTaskRepository,
        private readonly StudyCardRepository $studyCardRepository,
        private readonly VideoStorageInterface $storage,
        private readonly EntityManagerInterface $entityManager,
        private readonly int $orphanClipRetentionDays,
    ) {
    }

    public function cleanup(
        ?\DateTimeImmutable $now = null,
        int $limit = 100,
        bool $dryRun = false,
    ): ReplayLabCleanupResult {
        $now ??= new \DateTimeImmutable();
        $result = new ReplayLabCleanupResult();

        $this->expireReplayOriginals($now, $limit, $dryRun, $result);
        $this->deleteOrphanClips($now, $limit, $dryRun, $result);

        if (!$dryRun) {
            $this->entityManager->flush();
        }

        return $result;
    }

    private function expireReplayOriginals(\DateTimeImmutable $now, int $limit, bool $dryRun, ReplayLabCleanupResult $result): void
    {
        $videos = $this->videoRepository->createQueryBuilder('video')
            ->andWhere('video.deleteAfter IS NOT NULL')
            ->andWhere('video.deleteAfter <= :now')
            ->andWhere('video.status NOT IN (:terminalStatuses)')
            ->setParameter('now', $now)
            ->setParameter('terminalStatuses', [ReplayVideo::STATUS_DELETED, ReplayVideo::STATUS_EXPIRED])
            ->orderBy('video.deleteAfter', 'ASC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();

        foreach ($videos as $video) {
            if (!$video instanceof ReplayVideo) {
                continue;
            }

            $deletedFile = $this->storage->exists($video->getStorageKey());
            if (!$dryRun) {
                if ($deletedFile) {
                    $this->storage->delete($video->getStorageKey());
                }
                $video
                    ->setStatus(ReplayVideo::STATUS_EXPIRED)
                    ->setDeletedAt($now)
                    ->setUpdatedAt($now);
            }

            $result->addExpiredReplay($deletedFile);
        }
    }

    private function deleteOrphanClips(\DateTimeImmutable $now, int $limit, bool $dryRun, ReplayLabCleanupResult $result): void
    {
        $cutoff = $now->modify(sprintf('-%d days', $this->orphanClipRetentionDays));
        $clips = $this->clipRepository->createQueryBuilder('clip')
            ->andWhere('clip.createdAt <= :cutoff')
            ->andWhere('clip.status != :deletedStatus')
            ->setParameter('cutoff', $cutoff)
            ->setParameter('deletedStatus', ReplayClip::STATUS_DELETED)
            ->orderBy('clip.createdAt', 'ASC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();

        foreach ($clips as $clip) {
            if (!$clip instanceof ReplayClip || $this->clipHasLearningReferences($clip)) {
                continue;
            }

            $deletedFile = $this->storage->exists($clip->getStorageKey());
            if (!$dryRun) {
                if ($deletedFile) {
                    $this->storage->delete($clip->getStorageKey());
                }
                $clip
                    ->setStatus(ReplayClip::STATUS_DELETED)
                    ->setDeletedAt($now)
                    ->setUpdatedAt($now);
            }

            $result->addDeletedOrphanClip($deletedFile);
        }
    }

    private function clipHasLearningReferences(ReplayClip $clip): bool
    {
        return null !== $this->practiceTaskRepository->findOneBy(['clip' => $clip])
            || null !== $this->studyCardRepository->findOneBy(['clip' => $clip]);
    }
}
