<?php declare(strict_types=1);

namespace App\Service;

final class ReplayLabCleanupResult
{
    public function __construct(
        private int $expiredReplays = 0,
        private int $deletedReplayFiles = 0,
        private int $deletedOrphanClips = 0,
        private int $deletedOrphanClipFiles = 0,
    ) {
    }

    public function addExpiredReplay(bool $deletedFile): void
    {
        ++$this->expiredReplays;
        if ($deletedFile) {
            ++$this->deletedReplayFiles;
        }
    }

    public function addDeletedOrphanClip(bool $deletedFile): void
    {
        ++$this->deletedOrphanClips;
        if ($deletedFile) {
            ++$this->deletedOrphanClipFiles;
        }
    }

    /**
     * @return array<string, int>
     */
    public function toArray(): array
    {
        return [
            'expiredReplays' => $this->expiredReplays,
            'deletedReplayFiles' => $this->deletedReplayFiles,
            'deletedOrphanClips' => $this->deletedOrphanClips,
            'deletedOrphanClipFiles' => $this->deletedOrphanClipFiles,
        ];
    }
}
