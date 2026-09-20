<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\OkiSetupRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use App\Util\Enum\ModerationState;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: OkiSetupRepository::class)]
#[ORM\Table(name: 'oki_setup', schema: 'sf6')]
#[ORM\Index(name: 'idx_oki_setup_profile', columns: ['oki_profile_id'])]
#[ORM\Index(name: 'idx_oki_setup_moderation', columns: ['moderation_state'])]
class OkiSetup
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'setups')]
    #[ORM\JoinColumn(name: 'oki_profile_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private OkiProfile $profile;

    #[ORM\Column(name: 'uses_drive_rush', options: ['default' => false])]
    private bool $usesDriveRush = false;

    #[ORM\Column(name: 'auto_timed', options: ['default' => false])]
    private bool $autoTimed = false;

    #[ORM\Column(name: 'corner_only', options: ['default' => false])]
    private bool $cornerOnly = false;

    #[ORM\Column(name: 'works_no_backroll', options: ['default' => true])]
    private bool $worksNoBackroll = true;

    #[ORM\Column(name: 'works_backroll', options: ['default' => true])]
    private bool $worksBackroll = true;

    #[ORM\Column(name: 'fake_no_backroll', options: ['default' => false])]
    private bool $fakeNoBackroll = false;

    #[ORM\Column(name: 'fake_backroll', options: ['default' => false])]
    private bool $fakeBackroll = false;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'author_id', referencedColumnName: 'id', nullable: true)]
    private ?User $author = null;

    #[ORM\Column(name: 'moderation_state', type: Types::STRING, length: 32, options: ['default' => 'approved'])]
    private string $moderationState = ModerationState::APPROVED->value;

    #[ORM\Column(name: 'submitted_for_review_at', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $submittedForReviewAt = null;

    #[ORM\Column(name: 'moderation_decided_at', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $moderationDecidedAt = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'moderation_decided_by_id', referencedColumnName: 'id', nullable: true)]
    private ?User $moderationDecidedBy = null;

    #[ORM\Column(name: 'moderation_reason', type: Types::TEXT, nullable: true)]
    private ?string $moderationReason = null;

    /** @var Collection<int, OkiNode> */
    #[ORM\OneToMany(targetEntity: OkiNode::class, mappedBy: 'setup', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['sortOrder' => 'ASC', 'id' => 'ASC'])]
    private Collection $nodes;

    public function __construct() { $this->nodes = new ArrayCollection(); }
    public function getId(): ?int { return $this->id; }
    public function getProfile(): OkiProfile { return $this->profile; }
    public function setProfile(OkiProfile $profile): self { $this->profile = $profile; return $this; }
    public function usesDriveRush(): bool { return $this->usesDriveRush; }
    public function setUsesDriveRush(bool $usesDriveRush): self { $this->usesDriveRush = $usesDriveRush; return $this; }
    public function isAutoTimed(): bool { return $this->autoTimed; }
    public function setAutoTimed(bool $autoTimed): self { $this->autoTimed = $autoTimed; return $this; }
    public function isCornerOnly(): bool { return $this->cornerOnly; }
    public function setCornerOnly(bool $cornerOnly): self { $this->cornerOnly = $cornerOnly; return $this; }
    public function worksNoBackroll(): bool { return $this->worksNoBackroll; }
    public function setWorksNoBackroll(bool $worksNoBackroll): self { $this->worksNoBackroll = $worksNoBackroll; return $this; }
    public function worksBackroll(): bool { return $this->worksBackroll; }
    public function setWorksBackroll(bool $worksBackroll): self { $this->worksBackroll = $worksBackroll; return $this; }
    public function isFakeNoBackroll(): bool { return $this->fakeNoBackroll; }
    public function setFakeNoBackroll(bool $fakeNoBackroll): self { $this->fakeNoBackroll = $fakeNoBackroll; return $this; }
    public function isFakeBackroll(): bool { return $this->fakeBackroll; }
    public function setFakeBackroll(bool $fakeBackroll): self { $this->fakeBackroll = $fakeBackroll; return $this; }
    public function getAuthor(): ?User { return $this->author; }
    public function setAuthor(?User $author): self { $this->author = $author; return $this; }
    public function getModerationState(): string { return $this->moderationState; }
    public function setModerationState(string $moderationState): self { $this->moderationState = $moderationState; return $this; }
    public function getSubmittedForReviewAt(): ?\DateTimeImmutable { return $this->submittedForReviewAt; }
    public function setSubmittedForReviewAt(?\DateTimeImmutable $submittedForReviewAt): self { $this->submittedForReviewAt = $submittedForReviewAt; return $this; }
    public function getModerationDecidedAt(): ?\DateTimeImmutable { return $this->moderationDecidedAt; }
    public function setModerationDecidedAt(?\DateTimeImmutable $moderationDecidedAt): self { $this->moderationDecidedAt = $moderationDecidedAt; return $this; }
    public function getModerationDecidedBy(): ?User { return $this->moderationDecidedBy; }
    public function setModerationDecidedBy(?User $moderationDecidedBy): self { $this->moderationDecidedBy = $moderationDecidedBy; return $this; }
    public function getModerationReason(): ?string { return $this->moderationReason; }
    public function setModerationReason(?string $moderationReason): self { $this->moderationReason = $moderationReason; return $this; }
    /** @return Collection<int, OkiNode> */
    public function getNodes(): Collection { return $this->nodes; }
    public function addNode(OkiNode $node): self { if (!$this->nodes->contains($node)) { $this->nodes->add($node); $node->setSetup($this); } return $this; }
}
