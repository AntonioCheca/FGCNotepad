<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\ReplayClipRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ReplayClipRepository::class)]
#[ORM\Table(name: 'replay_clip', schema: 'forum')]
#[ORM\UniqueConstraint(name: 'uniq_replay_clip_source_annotation', columns: ['source_annotation_id'])]
#[ORM\Index(name: 'idx_replay_clip_owner_status', columns: ['owner_user_id', 'status'])]
class ReplayClip
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_READY = 'ready';
    public const STATUS_FAILED = 'failed';
    public const STATUS_DELETED = 'deleted';

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'owner_user_id', referencedColumnName: 'id', nullable: false)]
    private ?User $ownerUser = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'source_video_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?ReplayVideo $sourceVideo = null;

    #[ORM\OneToOne]
    #[ORM\JoinColumn(name: 'source_annotation_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?ReplayAnnotation $sourceAnnotation = null;

    #[ORM\Column(name: 'storage_key', type: Types::STRING, length: 512)]
    private string $storageKey = '';

    #[ORM\Column(name: 'mime_type', type: Types::STRING, length: 128)]
    private string $mimeType = '';

    #[ORM\Column(name: 'size_bytes', type: Types::BIGINT)]
    private int $sizeBytes = 0;

    #[ORM\Column(name: 'duration_ms', type: Types::INTEGER)]
    private int $durationMs = 0;

    #[ORM\Column(name: 'start_time_ms', type: Types::INTEGER)]
    private int $startTimeMs = 0;

    #[ORM\Column(name: 'end_time_ms', type: Types::INTEGER)]
    private int $endTimeMs = 0;

    #[ORM\Column(name: 'start_frame', type: Types::INTEGER, nullable: true)]
    private ?int $startFrame = null;

    #[ORM\Column(name: 'end_frame', type: Types::INTEGER, nullable: true)]
    private ?int $endFrame = null;

    #[ORM\Column(type: Types::STRING, length: 32)]
    private string $status = self::STATUS_PENDING;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $updatedAt;

    #[ORM\Column(name: 'deleted_at', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $deletedAt = null;

    public function __construct()
    {
        $now = new \DateTimeImmutable();
        $this->createdAt = $now;
        $this->updatedAt = $now;
    }

    public function getId(): ?Uuid { return $this->id; }
    public function getOwnerUser(): ?User { return $this->ownerUser; }
    public function setOwnerUser(?User $ownerUser): static { $this->ownerUser = $ownerUser; return $this; }
    public function getSourceVideo(): ?ReplayVideo { return $this->sourceVideo; }
    public function setSourceVideo(?ReplayVideo $sourceVideo): static { $this->sourceVideo = $sourceVideo; return $this; }
    public function getSourceAnnotation(): ?ReplayAnnotation { return $this->sourceAnnotation; }
    public function setSourceAnnotation(?ReplayAnnotation $sourceAnnotation): static { $this->sourceAnnotation = $sourceAnnotation; return $this; }
    public function getStorageKey(): string { return $this->storageKey; }
    public function setStorageKey(string $storageKey): static { $this->storageKey = $storageKey; return $this; }
    public function getMimeType(): string { return $this->mimeType; }
    public function setMimeType(string $mimeType): static { $this->mimeType = $mimeType; return $this; }
    public function getSizeBytes(): int { return $this->sizeBytes; }
    public function setSizeBytes(int $sizeBytes): static { $this->sizeBytes = $sizeBytes; return $this; }
    public function getDurationMs(): int { return $this->durationMs; }
    public function setDurationMs(int $durationMs): static { $this->durationMs = $durationMs; return $this; }
    public function getStartTimeMs(): int { return $this->startTimeMs; }
    public function setStartTimeMs(int $startTimeMs): static { $this->startTimeMs = $startTimeMs; return $this; }
    public function getEndTimeMs(): int { return $this->endTimeMs; }
    public function setEndTimeMs(int $endTimeMs): static { $this->endTimeMs = $endTimeMs; return $this; }
    public function getStartFrame(): ?int { return $this->startFrame; }
    public function setStartFrame(?int $startFrame): static { $this->startFrame = $startFrame; return $this; }
    public function getEndFrame(): ?int { return $this->endFrame; }
    public function setEndFrame(?int $endFrame): static { $this->endFrame = $endFrame; return $this; }
    public function getStatus(): string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function setCreatedAt(\DateTimeImmutable $createdAt): static { $this->createdAt = $createdAt; return $this; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updatedAt; }
    public function setUpdatedAt(\DateTimeImmutable $updatedAt): static { $this->updatedAt = $updatedAt; return $this; }
    public function getDeletedAt(): ?\DateTimeImmutable { return $this->deletedAt; }
    public function setDeletedAt(?\DateTimeImmutable $deletedAt): static { $this->deletedAt = $deletedAt; return $this; }
}
