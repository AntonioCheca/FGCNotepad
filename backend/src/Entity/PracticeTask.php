<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\PracticeTaskRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: PracticeTaskRepository::class)]
#[ORM\Table(name: 'practice_task', schema: 'forum')]
#[ORM\UniqueConstraint(name: 'uniq_practice_task_source_annotation', columns: ['source_annotation_id'])]
#[ORM\Index(name: 'idx_practice_task_user_status_due', columns: ['user_id', 'status', 'due_date'])]
class PracticeTask
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_DONE = 'done';
    public const STATUS_DISMISSED = 'dismissed';

    public const SCHEDULE_ONCE = 'once';
    public const SCHEDULE_DAILY_FOR_N_DAYS = 'daily_for_n_days';
    public const SCHEDULE_WEEKLY = 'weekly';
    public const SCHEDULE_CUSTOM = 'custom';

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false)]
    private ?User $user = null;

    #[ORM\OneToOne]
    #[ORM\JoinColumn(name: 'source_annotation_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?ReplayAnnotation $sourceAnnotation = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'clip_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?ReplayClip $clip = null;

    #[ORM\Column(type: Types::STRING, length: 255)]
    private string $title = '';

    #[ORM\Column(type: Types::TEXT)]
    private string $description = '';

    #[ORM\Column(type: Types::STRING, length: 64)]
    private string $category = '';

    #[ORM\Column(type: Types::STRING, length: 32)]
    private string $status = self::STATUS_PENDING;

    #[ORM\Column(name: 'due_date', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $dueDate = null;

    #[ORM\Column(name: 'schedule_type', type: Types::STRING, length: 32)]
    private string $scheduleType = self::SCHEDULE_ONCE;

    #[ORM\Column(name: 'remaining_occurrences', type: Types::INTEGER)]
    private int $remainingOccurrences = 1;

    #[ORM\Column(name: 'completed_occurrences', type: Types::INTEGER)]
    private int $completedOccurrences = 0;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $updatedAt;

    #[ORM\Column(name: 'completed_at', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $completedAt = null;

    public function __construct()
    {
        $now = new \DateTimeImmutable();
        $this->createdAt = $now;
        $this->updatedAt = $now;
    }

    public function getId(): ?Uuid { return $this->id; }
    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $user): static { $this->user = $user; return $this; }
    public function getSourceAnnotation(): ?ReplayAnnotation { return $this->sourceAnnotation; }
    public function setSourceAnnotation(?ReplayAnnotation $sourceAnnotation): static { $this->sourceAnnotation = $sourceAnnotation; return $this; }
    public function getClip(): ?ReplayClip { return $this->clip; }
    public function setClip(?ReplayClip $clip): static { $this->clip = $clip; return $this; }
    public function getTitle(): string { return $this->title; }
    public function setTitle(string $title): static { $this->title = $title; return $this; }
    public function getDescription(): string { return $this->description; }
    public function setDescription(string $description): static { $this->description = $description; return $this; }
    public function getCategory(): string { return $this->category; }
    public function setCategory(string $category): static { $this->category = $category; return $this; }
    public function getStatus(): string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }
    public function getDueDate(): ?\DateTimeImmutable { return $this->dueDate; }
    public function setDueDate(?\DateTimeImmutable $dueDate): static { $this->dueDate = $dueDate; return $this; }
    public function getScheduleType(): string { return $this->scheduleType; }
    public function setScheduleType(string $scheduleType): static { $this->scheduleType = $scheduleType; return $this; }
    public function getRemainingOccurrences(): int { return $this->remainingOccurrences; }
    public function setRemainingOccurrences(int $remainingOccurrences): static { $this->remainingOccurrences = $remainingOccurrences; return $this; }
    public function getCompletedOccurrences(): int { return $this->completedOccurrences; }
    public function setCompletedOccurrences(int $completedOccurrences): static { $this->completedOccurrences = $completedOccurrences; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function setCreatedAt(\DateTimeImmutable $createdAt): static { $this->createdAt = $createdAt; return $this; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updatedAt; }
    public function setUpdatedAt(\DateTimeImmutable $updatedAt): static { $this->updatedAt = $updatedAt; return $this; }
    public function getCompletedAt(): ?\DateTimeImmutable { return $this->completedAt; }
    public function setCompletedAt(?\DateTimeImmutable $completedAt): static { $this->completedAt = $completedAt; return $this; }
}
