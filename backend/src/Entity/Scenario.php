<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\ScenarioRepository;
use App\Util\Enum\ModerationState;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Table(name: "scenario", schema: "sf6")]
#[ORM\Index(name: "idx_scenario_public_id", columns: ["public_id"])]
#[ORM\Index(name: "idx_scenario_search_label", columns: ["search_label"])]
#[ORM\Index(name: "idx_scenario_is_essential", columns: ["is_essential"])]
#[ORM\Entity(repositoryClass: ScenarioRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Scenario
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'public_id', type: UuidType::NAME, unique: true)]
    private Uuid $publicId;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $name = null;

    #[ORM\Column(name: 'search_label', type: Types::TEXT)]
    private string $searchLabel = '';

    #[ORM\Column(name: 'scenario_type', type: Types::STRING, length: 32)]
    private string $scenarioType = 'oki';

    #[ORM\Column(name: 'is_essential', type: Types::BOOLEAN, options: ['default' => false])]
    private bool $isEssential = false;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'defender_character_id', referencedColumnName: 'id', nullable: false)]
    private ?Character $defenderCharacter = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'attacker_character_id', referencedColumnName: 'id', nullable: false)]
    private ?Character $attackerCharacter = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'trigger_move_id', referencedColumnName: 'id', nullable: false)]
    private ?Move $triggerMove = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $updatedAt;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'author_id', referencedColumnName: 'id', nullable: true)]
    private ?User $author = null;

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
    #[ORM\JoinColumn(nullable: true)]
    private ?ScenarioType $type = null;

    /**
     * @var Collection<int, ScenarioLayer>
     */
    #[ORM\OneToMany(mappedBy: 'scenario', targetEntity: ScenarioLayer::class, cascade: ['persist'])]
    private Collection $layers;

    /**
     * @var Collection<int, ScenarioRow>
     */
    #[ORM\OneToMany(mappedBy: 'scenario', targetEntity: ScenarioRow::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['position' => 'ASC'])]
    private Collection $rows;

    /**
     * @var Collection<int, ScenarioColumn>
     */
    #[ORM\OneToMany(mappedBy: 'scenario', targetEntity: ScenarioColumn::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['position' => 'ASC'])]
    private Collection $columns;

    /**
     * @var Collection<int, ScenarioCell>
     */
    #[ORM\OneToMany(mappedBy: 'scenario', targetEntity: ScenarioCell::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $cells;

    #[ORM\OneToOne(mappedBy: 'scenario', targetEntity: ScenarioComboContext::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private ?ScenarioComboContext $comboContext = null;

    public function __construct()
    {
        $this->layers = new ArrayCollection();
        $this->rows = new ArrayCollection();
        $this->columns = new ArrayCollection();
        $this->cells = new ArrayCollection();
        $this->publicId = Uuid::v7();
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getPublicId(): Uuid
    {
        return $this->publicId;
    }

    public function setPublicId(Uuid $publicId): static
    {
        $this->publicId = $publicId;

        return $this;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;
        $this->searchLabel = mb_strtolower(trim($name));

        return $this;
    }

    public function getSearchLabel(): string
    {
        return $this->searchLabel;
    }

    public function setSearchLabel(string $searchLabel): static
    {
        $this->searchLabel = mb_strtolower(trim($searchLabel));

        return $this;
    }

    public function getScenarioType(): string
    {
        return $this->scenarioType;
    }

    public function setScenarioType(string $scenarioType): static
    {
        $normalized = trim(mb_strtolower($scenarioType));
        $this->scenarioType = in_array($normalized, ['oki', 'blockstring', 'aggregated_oki'], true) ? $normalized : 'oki';

        return $this;
    }

    public function isEssential(): bool
    {
        return $this->isEssential;
    }

    public function setIsEssential(bool $isEssential): static
    {
        $this->isEssential = $isEssential;

        return $this;
    }

    public function getDefenderCharacter(): ?Character
    {
        return $this->defenderCharacter;
    }

    public function setDefenderCharacter(?Character $defenderCharacter): static
    {
        $this->defenderCharacter = $defenderCharacter;

        return $this;
    }

    public function getAttackerCharacter(): ?Character
    {
        return $this->attackerCharacter;
    }

    public function setAttackerCharacter(?Character $attackerCharacter): static
    {
        $this->attackerCharacter = $attackerCharacter;

        return $this;
    }

    public function getTriggerMove(): ?Move
    {
        return $this->triggerMove;
    }

    public function setTriggerMove(?Move $triggerMove): static
    {
        $this->triggerMove = $triggerMove;

        return $this;
    }

    public function getComboContext(): ?ScenarioComboContext
    {
        return $this->comboContext;
    }

    public function setComboContext(?ScenarioComboContext $comboContext): static
    {
        if (null !== $comboContext && $comboContext->getScenario() !== $this) {
            $comboContext->setScenario($this);
        }

        $this->comboContext = $comboContext;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeImmutable $updatedAt): static
    {
        $this->updatedAt = $updatedAt;

        return $this;
    }

    public function getAuthor(): ?User
    {
        return $this->author;
    }

    public function setAuthor(?User $author): static
    {
        $this->author = $author;

        return $this;
    }

    public function getModerationState(): string
    {
        return $this->moderationState;
    }

    public function setModerationState(string $moderationState): static
    {
        $this->moderationState = $moderationState;

        return $this;
    }

    public function getSubmittedForReviewAt(): ?\DateTimeImmutable
    {
        return $this->submittedForReviewAt;
    }

    public function setSubmittedForReviewAt(?\DateTimeImmutable $submittedForReviewAt): static
    {
        $this->submittedForReviewAt = $submittedForReviewAt;

        return $this;
    }

    public function getModerationDecidedAt(): ?\DateTimeImmutable
    {
        return $this->moderationDecidedAt;
    }

    public function setModerationDecidedAt(?\DateTimeImmutable $moderationDecidedAt): static
    {
        $this->moderationDecidedAt = $moderationDecidedAt;

        return $this;
    }

    public function getModerationDecidedBy(): ?User
    {
        return $this->moderationDecidedBy;
    }

    public function setModerationDecidedBy(?User $moderationDecidedBy): static
    {
        $this->moderationDecidedBy = $moderationDecidedBy;

        return $this;
    }

    public function getModerationReason(): ?string
    {
        return $this->moderationReason;
    }

    public function setModerationReason(?string $moderationReason): static
    {
        $this->moderationReason = $moderationReason;

        return $this;
    }

    public function getType(): ?ScenarioType
    {
        return $this->type;
    }

    public function setType(?ScenarioType $type): static
    {
        $this->type = $type;

        return $this;
    }

    /**
     * @return Collection<int, ScenarioLayer>
     */
    public function getLayers(): Collection
    {
        return $this->layers;
    }

    public function addLayer(ScenarioLayer $layer): static
    {
        if (!$this->layers->contains($layer)) {
            $this->layers->add($layer);
            $layer->setScenario($this);
        }

        return $this;
    }

    public function removeLayer(ScenarioLayer $layer): static
    {
        if ($this->layers->removeElement($layer)) {
            // set the owning side to null (unless already changed)
            if ($layer->getScenario() === $this) {
                $layer->setScenario(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, ScenarioRow>
     */
    public function getRows(): Collection
    {
        return $this->rows;
    }

    public function addRow(ScenarioRow $row): static
    {
        if (!$this->rows->contains($row)) {
            $this->rows->add($row);
            $row->setScenario($this);
        }

        return $this;
    }

    public function removeRow(ScenarioRow $row): static
    {
        if ($this->rows->removeElement($row) && $row->getScenario() === $this) {
            $row->setScenario(null);
        }

        return $this;
    }

    /**
     * @return Collection<int, ScenarioColumn>
     */
    public function getColumns(): Collection
    {
        return $this->columns;
    }

    public function addColumn(ScenarioColumn $column): static
    {
        if (!$this->columns->contains($column)) {
            $this->columns->add($column);
            $column->setScenario($this);
        }

        return $this;
    }

    public function removeColumn(ScenarioColumn $column): static
    {
        if ($this->columns->removeElement($column) && $column->getScenario() === $this) {
            $column->setScenario(null);
        }

        return $this;
    }

    /**
     * @return Collection<int, ScenarioCell>
     */
    public function getCells(): Collection
    {
        return $this->cells;
    }

    public function addCell(ScenarioCell $cell): static
    {
        if (!$this->cells->contains($cell)) {
            $this->cells->add($cell);
            $cell->setScenario($this);
        }

        return $this;
    }

    public function removeCell(ScenarioCell $cell): static
    {
        if ($this->cells->removeElement($cell) && $cell->getScenario() === $this) {
            $cell->setScenario(null);
        }

        return $this;
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        if (!isset($this->publicId)) {
            $this->publicId = Uuid::v7();
        }

        if (null === $this->name) {
            $this->name = '';
        }

        $this->searchLabel = mb_strtolower(trim($this->name));

        $now = new \DateTimeImmutable();
        $this->createdAt = $this->createdAt ?? $now;
        $this->updatedAt = $this->updatedAt ?? $now;
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
        $this->searchLabel = mb_strtolower(trim((string) $this->name));
    }
}
