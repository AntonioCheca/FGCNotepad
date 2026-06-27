<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\StudyCardRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: StudyCardRepository::class)]
#[ORM\Table(name: 'study_card', schema: 'forum')]
#[ORM\UniqueConstraint(name: 'uniq_study_card_source_annotation', columns: ['source_annotation_id'])]
#[ORM\Index(name: 'idx_study_card_user_due', columns: ['user_id', 'due_at'])]
class StudyCard
{
    public const FRONT_TYPE_VIDEO_CLIP = 'video_clip';

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

    #[ORM\Column(name: 'front_type', type: Types::STRING, length: 32)]
    private string $frontType = self::FRONT_TYPE_VIDEO_CLIP;

    #[ORM\Column(type: Types::TEXT)]
    private string $prompt = '';

    #[ORM\Column(name: 'correct_answer', type: Types::TEXT)]
    private string $correctAnswer = '';

    #[ORM\Column(type: Types::STRING, length: 64)]
    private string $category = '';

    #[ORM\Column(name: 'due_at', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $dueAt;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $stability = null;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $difficulty = null;

    #[ORM\Column(name: 'interval_days', type: Types::INTEGER)]
    private int $intervalDays = 0;

    #[ORM\Column(name: 'repetition_count', type: Types::INTEGER)]
    private int $repetitionCount = 0;

    #[ORM\Column(name: 'lapse_count', type: Types::INTEGER)]
    private int $lapseCount = 0;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $updatedAt;

    #[ORM\Column(name: 'suspended_at', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $suspendedAt = null;

    public function __construct()
    {
        $now = new \DateTimeImmutable();
        $this->dueAt = $now;
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
    public function getFrontType(): string { return $this->frontType; }
    public function setFrontType(string $frontType): static { $this->frontType = $frontType; return $this; }
    public function getPrompt(): string { return $this->prompt; }
    public function setPrompt(string $prompt): static { $this->prompt = $prompt; return $this; }
    public function getCorrectAnswer(): string { return $this->correctAnswer; }
    public function setCorrectAnswer(string $correctAnswer): static { $this->correctAnswer = $correctAnswer; return $this; }
    public function getCategory(): string { return $this->category; }
    public function setCategory(string $category): static { $this->category = $category; return $this; }
    public function getDueAt(): \DateTimeImmutable { return $this->dueAt; }
    public function setDueAt(\DateTimeImmutable $dueAt): static { $this->dueAt = $dueAt; return $this; }
    public function getStability(): ?float { return $this->stability; }
    public function setStability(?float $stability): static { $this->stability = $stability; return $this; }
    public function getDifficulty(): ?float { return $this->difficulty; }
    public function setDifficulty(?float $difficulty): static { $this->difficulty = $difficulty; return $this; }
    public function getIntervalDays(): int { return $this->intervalDays; }
    public function setIntervalDays(int $intervalDays): static { $this->intervalDays = $intervalDays; return $this; }
    public function getRepetitionCount(): int { return $this->repetitionCount; }
    public function setRepetitionCount(int $repetitionCount): static { $this->repetitionCount = $repetitionCount; return $this; }
    public function getLapseCount(): int { return $this->lapseCount; }
    public function setLapseCount(int $lapseCount): static { $this->lapseCount = $lapseCount; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function setCreatedAt(\DateTimeImmutable $createdAt): static { $this->createdAt = $createdAt; return $this; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updatedAt; }
    public function setUpdatedAt(\DateTimeImmutable $updatedAt): static { $this->updatedAt = $updatedAt; return $this; }
    public function getSuspendedAt(): ?\DateTimeImmutable { return $this->suspendedAt; }
    public function setSuspendedAt(?\DateTimeImmutable $suspendedAt): static { $this->suspendedAt = $suspendedAt; return $this; }
}
