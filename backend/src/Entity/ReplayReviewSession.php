<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\ReplayReviewSessionRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ReplayReviewSessionRepository::class)]
#[ORM\Table(name: 'replay_review_session', schema: 'forum')]
#[ORM\Index(name: 'idx_replay_review_session_owner_status', columns: ['owner_user_id', 'status'])]
#[ORM\Index(name: 'idx_replay_review_session_video', columns: ['video_id'])]
class ReplayReviewSession
{
    public const STATUS_DRAFT = 'draft';
    public const STATUS_SAVED = 'saved';
    public const STATUS_ARCHIVED = 'archived';

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'video_id', referencedColumnName: 'id', nullable: false)]
    private ?ReplayVideo $video = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'owner_user_id', referencedColumnName: 'id', nullable: false)]
    private ?User $ownerUser = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'created_by_user_id', referencedColumnName: 'id', nullable: false)]
    private ?User $createdByUser = null;

    #[ORM\Column(type: Types::STRING, length: 255)]
    private string $title = '';

    #[ORM\Column(type: Types::STRING, length: 32)]
    private string $status = self::STATUS_DRAFT;

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
    public function getVideo(): ?ReplayVideo { return $this->video; }
    public function setVideo(?ReplayVideo $video): static { $this->video = $video; return $this; }
    public function getOwnerUser(): ?User { return $this->ownerUser; }
    public function setOwnerUser(?User $ownerUser): static { $this->ownerUser = $ownerUser; return $this; }
    public function getCreatedByUser(): ?User { return $this->createdByUser; }
    public function setCreatedByUser(?User $createdByUser): static { $this->createdByUser = $createdByUser; return $this; }
    public function getTitle(): string { return $this->title; }
    public function setTitle(string $title): static { $this->title = $title; return $this; }
    public function getStatus(): string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function setCreatedAt(\DateTimeImmutable $createdAt): static { $this->createdAt = $createdAt; return $this; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updatedAt; }
    public function setUpdatedAt(\DateTimeImmutable $updatedAt): static { $this->updatedAt = $updatedAt; return $this; }
}
