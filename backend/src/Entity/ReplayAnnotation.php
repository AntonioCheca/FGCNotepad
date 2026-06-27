<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\ReplayAnnotationRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ReplayAnnotationRepository::class)]
#[ORM\Table(name: 'replay_annotation', schema: 'forum')]
#[ORM\UniqueConstraint(name: 'uniq_replay_annotation_exported_clip', columns: ['exported_clip_id'])]
#[ORM\Index(name: 'idx_replay_annotation_session', columns: ['session_id'])]
#[ORM\Index(name: 'idx_replay_annotation_event_kind_category', columns: ['event_kind', 'category'])]
class ReplayAnnotation
{
    public const EVENT_KIND_MEMORY = 'memory';
    public const EVENT_KIND_TASK = 'task';

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'session_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?ReplayReviewSession $session = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'created_by_user_id', referencedColumnName: 'id', nullable: false)]
    private ?User $createdByUser = null;

    #[ORM\Column(name: 'start_time_ms', type: Types::INTEGER)]
    private int $startTimeMs = 0;

    #[ORM\Column(name: 'end_time_ms', type: Types::INTEGER)]
    private int $endTimeMs = 0;

    #[ORM\Column(name: 'start_frame', type: Types::INTEGER, nullable: true)]
    private ?int $startFrame = null;

    #[ORM\Column(name: 'end_frame', type: Types::INTEGER, nullable: true)]
    private ?int $endFrame = null;

    #[ORM\Column(name: 'event_kind', type: Types::STRING, length: 32)]
    private string $eventKind = self::EVENT_KIND_MEMORY;

    #[ORM\Column(type: Types::STRING, length: 64)]
    private string $category = '';

    #[ORM\Column(type: Types::STRING, length: 255, nullable: true)]
    private ?string $title = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $notes = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $answer = null;

    #[ORM\OneToOne]
    #[ORM\JoinColumn(name: 'exported_clip_id', referencedColumnName: 'id', nullable: true, unique: true, onDelete: 'SET NULL')]
    private ?ReplayClip $exportedClip = null;

    #[ORM\Column(name: 'export_error', type: Types::TEXT, nullable: true)]
    private ?string $exportError = null;

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
    public function getSession(): ?ReplayReviewSession { return $this->session; }
    public function setSession(?ReplayReviewSession $session): static { $this->session = $session; return $this; }
    public function getCreatedByUser(): ?User { return $this->createdByUser; }
    public function setCreatedByUser(?User $createdByUser): static { $this->createdByUser = $createdByUser; return $this; }
    public function getStartTimeMs(): int { return $this->startTimeMs; }
    public function setStartTimeMs(int $startTimeMs): static { $this->startTimeMs = $startTimeMs; return $this; }
    public function getEndTimeMs(): int { return $this->endTimeMs; }
    public function setEndTimeMs(int $endTimeMs): static { $this->endTimeMs = $endTimeMs; return $this; }
    public function getStartFrame(): ?int { return $this->startFrame; }
    public function setStartFrame(?int $startFrame): static { $this->startFrame = $startFrame; return $this; }
    public function getEndFrame(): ?int { return $this->endFrame; }
    public function setEndFrame(?int $endFrame): static { $this->endFrame = $endFrame; return $this; }
    public function getEventKind(): string { return $this->eventKind; }
    public function setEventKind(string $eventKind): static { $this->eventKind = $eventKind; return $this; }
    public function getCategory(): string { return $this->category; }
    public function setCategory(string $category): static { $this->category = $category; return $this; }
    public function getTitle(): ?string { return $this->title; }
    public function setTitle(?string $title): static { $this->title = $title; return $this; }
    public function getNotes(): ?string { return $this->notes; }
    public function setNotes(?string $notes): static { $this->notes = $notes; return $this; }
    public function getAnswer(): ?string { return $this->answer; }
    public function setAnswer(?string $answer): static { $this->answer = $answer; return $this; }
    public function getExportedClip(): ?ReplayClip { return $this->exportedClip; }
    public function setExportedClip(?ReplayClip $exportedClip): static { $this->exportedClip = $exportedClip; return $this; }
    public function getExportError(): ?string { return $this->exportError; }
    public function setExportError(?string $exportError): static { $this->exportError = $exportError; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function setCreatedAt(\DateTimeImmutable $createdAt): static { $this->createdAt = $createdAt; return $this; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updatedAt; }
    public function setUpdatedAt(\DateTimeImmutable $updatedAt): static { $this->updatedAt = $updatedAt; return $this; }
}
