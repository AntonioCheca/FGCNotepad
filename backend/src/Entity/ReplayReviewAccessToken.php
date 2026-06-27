<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\ReplayReviewAccessTokenRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ReplayReviewAccessTokenRepository::class)]
#[ORM\Table(name: 'replay_review_access_token', schema: 'forum')]
#[ORM\UniqueConstraint(name: 'uniq_replay_review_access_token_hash', columns: ['token_hash'])]
#[ORM\Index(name: 'idx_replay_review_access_token_session', columns: ['session_id'])]
#[ORM\Index(name: 'idx_replay_review_access_token_expires', columns: ['expires_at'])]
class ReplayReviewAccessToken
{
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

    #[ORM\Column(name: 'token_hash', type: Types::STRING, length: 64)]
    private string $tokenHash = '';

    #[ORM\Column(type: Types::STRING, length: 255, nullable: true)]
    private ?string $label = null;

    #[ORM\Column(name: 'password_hash', type: Types::STRING, length: 255, nullable: true)]
    private ?string $passwordHash = null;

    #[ORM\Column(name: 'expires_at', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $expiresAt = null;

    #[ORM\Column(name: 'max_uses', type: Types::INTEGER, nullable: true)]
    private ?int $maxUses = null;

    #[ORM\Column(name: 'used_count', type: Types::INTEGER)]
    private int $usedCount = 0;

    #[ORM\Column(name: 'can_view', type: Types::BOOLEAN)]
    private bool $canView = true;

    #[ORM\Column(name: 'can_annotate', type: Types::BOOLEAN)]
    private bool $canAnnotate = true;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(name: 'revoked_at', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $revokedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?Uuid { return $this->id; }
    public function getSession(): ?ReplayReviewSession { return $this->session; }
    public function setSession(?ReplayReviewSession $session): static { $this->session = $session; return $this; }
    public function getCreatedByUser(): ?User { return $this->createdByUser; }
    public function setCreatedByUser(?User $createdByUser): static { $this->createdByUser = $createdByUser; return $this; }
    public function getTokenHash(): string { return $this->tokenHash; }
    public function setTokenHash(string $tokenHash): static { $this->tokenHash = $tokenHash; return $this; }
    public function getLabel(): ?string { return $this->label; }
    public function setLabel(?string $label): static { $this->label = $label; return $this; }
    public function getPasswordHash(): ?string { return $this->passwordHash; }
    public function setPasswordHash(?string $passwordHash): static { $this->passwordHash = $passwordHash; return $this; }
    public function getExpiresAt(): ?\DateTimeImmutable { return $this->expiresAt; }
    public function setExpiresAt(?\DateTimeImmutable $expiresAt): static { $this->expiresAt = $expiresAt; return $this; }
    public function getMaxUses(): ?int { return $this->maxUses; }
    public function setMaxUses(?int $maxUses): static { $this->maxUses = $maxUses; return $this; }
    public function getUsedCount(): int { return $this->usedCount; }
    public function setUsedCount(int $usedCount): static { $this->usedCount = $usedCount; return $this; }
    public function incrementUsedCount(): static { ++$this->usedCount; return $this; }
    public function canView(): bool { return $this->canView; }
    public function setCanView(bool $canView): static { $this->canView = $canView; return $this; }
    public function canAnnotate(): bool { return $this->canAnnotate; }
    public function setCanAnnotate(bool $canAnnotate): static { $this->canAnnotate = $canAnnotate; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function setCreatedAt(\DateTimeImmutable $createdAt): static { $this->createdAt = $createdAt; return $this; }
    public function getRevokedAt(): ?\DateTimeImmutable { return $this->revokedAt; }
    public function setRevokedAt(?\DateTimeImmutable $revokedAt): static { $this->revokedAt = $revokedAt; return $this; }
}
