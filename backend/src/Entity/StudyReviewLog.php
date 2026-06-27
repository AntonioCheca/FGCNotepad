<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\StudyReviewLogRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: StudyReviewLogRepository::class)]
#[ORM\Table(name: 'study_review_log', schema: 'forum')]
#[ORM\Index(name: 'idx_study_review_log_card_reviewed', columns: ['card_id', 'reviewed_at'])]
#[ORM\Index(name: 'idx_study_review_log_user_reviewed', columns: ['user_id', 'reviewed_at'])]
class StudyReviewLog
{
    public const RATING_AGAIN = 'again';
    public const RATING_HARD = 'hard';
    public const RATING_GOOD = 'good';
    public const RATING_EASY = 'easy';

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'card_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?StudyCard $card = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false)]
    private ?User $user = null;

    #[ORM\Column(type: Types::STRING, length: 16)]
    private string $rating = self::RATING_GOOD;

    #[ORM\Column(name: 'was_correct', type: Types::BOOLEAN)]
    private bool $wasCorrect = false;

    #[ORM\Column(name: 'reviewed_at', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $reviewedAt;

    #[ORM\Column(name: 'previous_due_at', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $previousDueAt;

    #[ORM\Column(name: 'next_due_at', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $nextDueAt;

    public function __construct()
    {
        $now = new \DateTimeImmutable();
        $this->reviewedAt = $now;
        $this->previousDueAt = $now;
        $this->nextDueAt = $now;
    }

    public function getId(): ?Uuid { return $this->id; }
    public function getCard(): ?StudyCard { return $this->card; }
    public function setCard(?StudyCard $card): static { $this->card = $card; return $this; }
    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $user): static { $this->user = $user; return $this; }
    public function getRating(): string { return $this->rating; }
    public function setRating(string $rating): static { $this->rating = $rating; return $this; }
    public function wasCorrect(): bool { return $this->wasCorrect; }
    public function setWasCorrect(bool $wasCorrect): static { $this->wasCorrect = $wasCorrect; return $this; }
    public function getReviewedAt(): \DateTimeImmutable { return $this->reviewedAt; }
    public function setReviewedAt(\DateTimeImmutable $reviewedAt): static { $this->reviewedAt = $reviewedAt; return $this; }
    public function getPreviousDueAt(): \DateTimeImmutable { return $this->previousDueAt; }
    public function setPreviousDueAt(\DateTimeImmutable $previousDueAt): static { $this->previousDueAt = $previousDueAt; return $this; }
    public function getNextDueAt(): \DateTimeImmutable { return $this->nextDueAt; }
    public function setNextDueAt(\DateTimeImmutable $nextDueAt): static { $this->nextDueAt = $nextDueAt; return $this; }
}
