<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\ReplayVideoRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ReplayVideoRepository::class)]
#[ORM\Table(name: 'replay_video', schema: 'forum')]
#[ORM\Index(name: 'idx_replay_video_owner_status', columns: ['owner_user_id', 'status'])]
#[ORM\Index(name: 'idx_replay_video_delete_after', columns: ['delete_after'])]
class ReplayVideo
{
    public const SOURCE_TYPE_UPLOAD = 'upload';
    public const SOURCE_TYPE_LOCAL_IMPORT = 'local_import';
    public const SOURCE_TYPE_LOCAL_FILE = 'local_file';
    public const SOURCE_TYPE_YOUTUBE = 'youtube';

    public const STATUS_UPLOADED = 'uploaded';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_READY = 'ready';
    public const STATUS_FAILED = 'failed';
    public const STATUS_EXPIRED = 'expired';
    public const STATUS_DELETED = 'deleted';

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'owner_user_id', referencedColumnName: 'id', nullable: false)]
    private ?User $ownerUser = null;

    #[ORM\Column(name: 'original_filename', type: Types::STRING, length: 255)]
    private string $originalFilename = '';

    #[ORM\Column(name: 'source_type', type: Types::STRING, length: 32)]
    private string $sourceType = self::SOURCE_TYPE_UPLOAD;

    #[ORM\Column(name: 'storage_key', type: Types::STRING, length: 512, nullable: true)]
    private string $storageKey = '';

    #[ORM\Column(name: 'youtube_video_id', type: Types::STRING, length: 32, nullable: true)]
    private ?string $youtubeVideoId = null;

    #[ORM\Column(name: 'youtube_url', type: Types::STRING, length: 512, nullable: true)]
    private ?string $youtubeUrl = null;

    #[ORM\Column(name: 'mime_type', type: Types::STRING, length: 128)]
    private string $mimeType = '';

    #[ORM\Column(name: 'size_bytes', type: Types::BIGINT)]
    private int $sizeBytes = 0;

    #[ORM\Column(name: 'duration_ms', type: Types::INTEGER)]
    private int $durationMs = 0;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $fps = null;

    #[ORM\Column(type: Types::STRING, length: 32)]
    private string $status = self::STATUS_UPLOADED;

    #[ORM\Column(name: 'delete_after', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $deleteAfter = null;

    #[ORM\Column(name: 'deleted_at', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $deletedAt = null;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $updatedAt;

    public function __construct()
    {
        $now = new \DateTimeImmutable();
        $this->createdAt = $now;
        $this->updatedAt = $now;
    }

    public function getId(): ?Uuid { return $this->id; }
    public function getOwnerUser(): ?User { return $this->ownerUser; }
    public function setOwnerUser(?User $ownerUser): static { $this->ownerUser = $ownerUser; return $this; }
    public function getOriginalFilename(): string { return $this->originalFilename; }
    public function setOriginalFilename(string $originalFilename): static { $this->originalFilename = $originalFilename; return $this; }
    public function getSourceType(): string { return $this->sourceType; }
    public function setSourceType(string $sourceType): static { $this->sourceType = $sourceType; return $this; }
    public function getStorageKey(): string { return $this->storageKey; }
    public function setStorageKey(string $storageKey): static { $this->storageKey = $storageKey; return $this; }
    public function getYoutubeVideoId(): ?string { return $this->youtubeVideoId; }
    public function setYoutubeVideoId(?string $youtubeVideoId): static { $this->youtubeVideoId = $youtubeVideoId; return $this; }
    public function getYoutubeUrl(): ?string { return $this->youtubeUrl; }
    public function setYoutubeUrl(?string $youtubeUrl): static { $this->youtubeUrl = $youtubeUrl; return $this; }
    public function getMimeType(): string { return $this->mimeType; }
    public function setMimeType(string $mimeType): static { $this->mimeType = $mimeType; return $this; }
    public function getSizeBytes(): int { return $this->sizeBytes; }
    public function setSizeBytes(int $sizeBytes): static { $this->sizeBytes = $sizeBytes; return $this; }
    public function getDurationMs(): int { return $this->durationMs; }
    public function setDurationMs(int $durationMs): static { $this->durationMs = $durationMs; return $this; }
    public function getFps(): ?float { return $this->fps; }
    public function setFps(?float $fps): static { $this->fps = $fps; return $this; }
    public function getStatus(): string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }
    public function getDeleteAfter(): ?\DateTimeImmutable { return $this->deleteAfter; }
    public function setDeleteAfter(?\DateTimeImmutable $deleteAfter): static { $this->deleteAfter = $deleteAfter; return $this; }
    public function getDeletedAt(): ?\DateTimeImmutable { return $this->deletedAt; }
    public function setDeletedAt(?\DateTimeImmutable $deletedAt): static { $this->deletedAt = $deletedAt; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function setCreatedAt(\DateTimeImmutable $createdAt): static { $this->createdAt = $createdAt; return $this; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updatedAt; }
    public function setUpdatedAt(\DateTimeImmutable $updatedAt): static { $this->updatedAt = $updatedAt; return $this; }
}
