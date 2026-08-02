<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\BlockstringSequenceRepository;
use App\Util\Enum\ModerationState;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: BlockstringSequenceRepository::class)]
#[ORM\Table(name: 'blockstring_sequence', schema: 'sf6')]
#[ORM\Index(name: 'idx_blockstring_sequence_attacker', columns: ['attacker_character_id'])]
#[ORM\Index(name: 'idx_blockstring_sequence_classification', columns: ['classification'])]
#[ORM\Index(name: 'idx_blockstring_sequence_moderation', columns: ['moderation_state'])]
class BlockstringSequence
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: Types::TEXT)]
    private string $title = '';

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $summary = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'attacker_character_id', referencedColumnName: 'id', nullable: false)]
    private ?Character $attackerCharacter = null;

    #[ORM\Column(type: Types::STRING, length: 32)]
    private string $classification = 'fake';

    #[ORM\Column(name: 'moderation_state', type: Types::STRING, length: 32)]
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

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'author_id', referencedColumnName: 'id', nullable: true)]
    private ?User $author = null;

    /** @var Collection<int, BlockstringSequenceStep> */
    #[ORM\OneToMany(targetEntity: BlockstringSequenceStep::class, mappedBy: 'sequence', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['ordinal' => 'ASC', 'id' => 'ASC'])]
    private Collection $steps;

    /** @var Collection<int, BlockstringDefenseEntry> */
    #[ORM\OneToMany(targetEntity: BlockstringDefenseEntry::class, mappedBy: 'sequence', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['id' => 'ASC'])]
    private Collection $defenseEntries;

    /** @var Collection<int, BlockstringGap> */
    #[ORM\OneToMany(targetEntity: BlockstringGap::class, mappedBy: 'sequence', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['id' => 'ASC'])]
    private Collection $gaps;

    /** @var Collection<int, BlockstringCondition> */
    #[ORM\OneToMany(targetEntity: BlockstringCondition::class, mappedBy: 'sequence', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['id' => 'ASC'])]
    private Collection $conditions;

    /** @var Collection<int, BlockstringAdaptation> */
    #[ORM\OneToMany(targetEntity: BlockstringAdaptation::class, mappedBy: 'sequence', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['sortOrder' => 'ASC', 'id' => 'ASC'])]
    private Collection $adaptations;

    public function __construct()
    {
        $this->steps = new ArrayCollection();
        $this->defenseEntries = new ArrayCollection();
        $this->gaps = new ArrayCollection();
        $this->conditions = new ArrayCollection();
        $this->adaptations = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }
    public function getTitle(): string { return $this->title; }
    public function setTitle(string $title): self { $this->title = $title; return $this; }
    public function getSummary(): ?string { return $this->summary; }
    public function setSummary(?string $summary): self { $this->summary = $summary; return $this; }
    public function getAttackerCharacter(): ?Character { return $this->attackerCharacter; }
    public function setAttackerCharacter(?Character $attackerCharacter): self { $this->attackerCharacter = $attackerCharacter; return $this; }
    public function getClassification(): string { return $this->classification; }
    public function setClassification(string $classification): self { $this->classification = $classification; return $this; }
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
    public function getAuthor(): ?User { return $this->author; }
    public function setAuthor(?User $author): self { $this->author = $author; return $this; }
    /** @return Collection<int, BlockstringSequenceStep> */ public function getSteps(): Collection { return $this->steps; }
    public function addStep(BlockstringSequenceStep $step): self { if (!$this->steps->contains($step)) { $this->steps->add($step); $step->setSequence($this); } return $this; }
    /** @return Collection<int, BlockstringDefenseEntry> */ public function getDefenseEntries(): Collection { return $this->defenseEntries; }
    public function addDefenseEntry(BlockstringDefenseEntry $entry): self { if (!$this->defenseEntries->contains($entry)) { $this->defenseEntries->add($entry); $entry->setSequence($this); } return $this; }
    /** @return Collection<int, BlockstringGap> */ public function getGaps(): Collection { return $this->gaps; }
    public function addGap(BlockstringGap $gap): self { if (!$this->gaps->contains($gap)) { $this->gaps->add($gap); $gap->setSequence($this); } return $this; }
    /** @return Collection<int, BlockstringCondition> */ public function getConditions(): Collection { return $this->conditions; }
    public function addCondition(BlockstringCondition $condition): self { if (!$this->conditions->contains($condition)) { $this->conditions->add($condition); $condition->setSequence($this); } return $this; }
    /** @return Collection<int, BlockstringAdaptation> */ public function getAdaptations(): Collection { return $this->adaptations; }
    public function addAdaptation(BlockstringAdaptation $adaptation): self { if (!$this->adaptations->contains($adaptation)) { $this->adaptations->add($adaptation); $adaptation->setSequence($this); } return $this; }
}
