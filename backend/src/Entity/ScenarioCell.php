<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Table(name: 'scenario_cell', schema: 'sf6')]
#[ORM\UniqueConstraint(name: 'uniq_scenario_cell_coordinates', columns: ['scenario_id', 'row_id', 'column_id'])]
#[ORM\Entity]
class ScenarioCell
{
    public const KIND_STATIC = 'static';
    public const KIND_REFERENCE = 'reference';
    public const KIND_DYNAMIC_COMBO = 'dynamic_combo';

    /** The linked scenario's attacker is this scenario's attacker: its EV adds to this cell. */
    public const PERSPECTIVE_SAME = 'same';
    /** The linked scenario's attacker is this scenario's defender: its EV is subtracted. */
    public const PERSPECTIVE_OPPONENT = 'opponent';
    public const PERSPECTIVES = [self::PERSPECTIVE_SAME, self::PERSPECTIVE_OPPONENT];

    public const PROVENANCE_OBSERVED = 'observed';
    public const PROVENANCE_INFERRED = 'inferred';
    public const PROVENANCE_DISPUTED = 'disputed';
    public const PROVENANCE_STATUSES = [self::PROVENANCE_OBSERVED, self::PROVENANCE_INFERRED, self::PROVENANCE_DISPUTED];
    public const PROVENANCE_NOTE_MAX_LENGTH = 500;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'cells')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Scenario $scenario = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'row_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?ScenarioRow $row = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'column_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?ScenarioColumn $column = null;

    #[ORM\Column(type: Types::STRING, length: 32)]
    private string $kind = self::KIND_STATIC;

    #[ORM\Column(name: 'static_value', type: Types::FLOAT, nullable: true)]
    private ?float $staticValue = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'reference_scenario_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?Scenario $referenceScenario = null;

    #[ORM\Column(name: 'reference_kind', type: Types::STRING, length: 16, nullable: true)]
    private ?string $referenceKind = null;

    #[ORM\Column(name: 'cached_value', type: Types::FLOAT, nullable: true)]
    private ?float $cachedValue = null;

    /** Share of the linked scenario's EV a reference cell counts; null means the whole EV. */
    #[ORM\Column(name: 'reference_weight', type: Types::FLOAT, nullable: true)]
    private ?float $referenceWeight = null;

    /** Null is the same side; only the opponent side is stored. */
    #[ORM\Column(name: 'reference_perspective', type: Types::STRING, length: 8, nullable: true)]
    private ?string $referencePerspective = null;

    #[ORM\Column(name: 'starter_context', type: Types::STRING, length: 24, nullable: true)]
    private ?string $starterContext = null;

    #[ORM\Column(name: 'is_combo_initiator_attacker', type: Types::BOOLEAN, options: ['default' => true])]
    private bool $isComboInitiatorAttacker = true;

    #[ORM\Column(name: 'provenance_status', type: Types::STRING, length: 16, nullable: true)]
    private ?string $provenanceStatus = null;

    #[ORM\Column(name: 'provenance_sample_count', type: Types::INTEGER, nullable: true)]
    private ?int $provenanceSampleCount = null;

    #[ORM\Column(name: 'provenance_confidence', type: Types::FLOAT, nullable: true)]
    private ?float $provenanceConfidence = null;

    #[ORM\Column(name: 'provenance_note', type: Types::STRING, length: 500, nullable: true)]
    private ?string $provenanceNote = null;

    /**
     * @var Collection<int, Move>
     */
    #[ORM\ManyToMany(targetEntity: Move::class)]
    #[ORM\JoinTable(
        name: 'sf6.scenario_cell_starter_move',
        joinColumns: [new ORM\JoinColumn(name: 'cell_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')],
        inverseJoinColumns: [new ORM\JoinColumn(name: 'move_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    )]
    private Collection $starterMoves;

    public function __construct()
    {
        $this->starterMoves = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getScenario(): ?Scenario
    {
        return $this->scenario;
    }

    public function setScenario(?Scenario $scenario): static
    {
        $this->scenario = $scenario;

        return $this;
    }

    public function getRow(): ?ScenarioRow
    {
        return $this->row;
    }

    public function setRow(?ScenarioRow $row): static
    {
        $this->row = $row;

        return $this;
    }

    public function getColumn(): ?ScenarioColumn
    {
        return $this->column;
    }

    public function setColumn(?ScenarioColumn $column): static
    {
        $this->column = $column;

        return $this;
    }

    public function getKind(): string
    {
        return $this->kind;
    }

    public function setKind(string $kind): static
    {
        $this->kind = $kind;

        return $this;
    }

    public function getStaticValue(): ?float
    {
        return $this->staticValue;
    }

    public function setStaticValue(?float $staticValue): static
    {
        $this->staticValue = $staticValue;

        return $this;
    }

    public function getReferenceScenario(): ?Scenario
    {
        return $this->referenceScenario;
    }

    public function setReferenceScenario(?Scenario $referenceScenario): static
    {
        $this->referenceScenario = $referenceScenario;

        return $this;
    }

    public function getReferenceKind(): ?string
    {
        return $this->referenceKind;
    }

    public function setReferenceKind(?string $referenceKind): static
    {
        $this->referenceKind = $referenceKind;

        return $this;
    }

    public function getCachedValue(): ?float
    {
        return $this->cachedValue;
    }

    public function setCachedValue(?float $cachedValue): static
    {
        $this->cachedValue = $cachedValue;

        return $this;
    }

    public function getReferenceWeight(): float
    {
        return $this->referenceWeight ?? 1.0;
    }

    /**
     * @param float|null $weight in (0, 1]; 1 or null stores the default, so unweighted references stay null
     */
    public function setReferenceWeight(?float $weight): static
    {
        if (null !== $weight && ($weight <= 0.0 || $weight > 1.0)) {
            throw new \InvalidArgumentException('A reference weight must be greater than 0 and at most 1.');
        }

        $this->referenceWeight = null === $weight || 1.0 === $weight ? null : $weight;

        return $this;
    }

    public function getReferencePerspective(): string
    {
        return $this->referencePerspective ?? self::PERSPECTIVE_SAME;
    }

    public function setReferencePerspective(?string $perspective): static
    {
        if (null !== $perspective && !in_array($perspective, self::PERSPECTIVES, true)) {
            throw new \InvalidArgumentException(sprintf('A reference perspective must be one of %s.', implode(', ', self::PERSPECTIVES)));
        }

        $this->referencePerspective = self::PERSPECTIVE_OPPONENT === $perspective ? $perspective : null;

        return $this;
    }

    /**
     * The signed factor applied to the linked scenario's EV: the weight, negated for the opponent's side.
     */
    public function getReferenceFactor(): float
    {
        return self::PERSPECTIVE_OPPONENT === $this->getReferencePerspective() ? -$this->getReferenceWeight() : $this->getReferenceWeight();
    }

    public function getStarterContext(): ?string
    {
        return $this->starterContext;
    }

    public function setStarterContext(?string $starterContext): static
    {
        $this->starterContext = $starterContext;

        return $this;
    }

    public function isComboInitiatorAttacker(): bool
    {
        return $this->isComboInitiatorAttacker;
    }

    public function setIsComboInitiatorAttacker(bool $isComboInitiatorAttacker): static
    {
        $this->isComboInitiatorAttacker = $isComboInitiatorAttacker;

        return $this;
    }

    /**
     * @return Collection<int, Move>
     */
    public function getStarterMoves(): Collection
    {
        return $this->starterMoves;
    }

    public function addStarterMove(Move $starterMove): static
    {
        if (!$this->starterMoves->contains($starterMove)) {
            $this->starterMoves->add($starterMove);
        }

        return $this;
    }

    public function removeStarterMove(Move $starterMove): static
    {
        $this->starterMoves->removeElement($starterMove);

        return $this;
    }

    public function getProvenanceStatus(): ?string
    {
        return $this->provenanceStatus;
    }

    public function getProvenanceSampleCount(): ?int
    {
        return $this->provenanceSampleCount;
    }

    public function getProvenanceConfidence(): ?float
    {
        return $this->provenanceConfidence;
    }

    public function getProvenanceNote(): ?string
    {
        return $this->provenanceNote;
    }

    public function hasProvenance(): bool
    {
        return null !== $this->provenanceStatus;
    }

    public function setProvenance(?string $status, ?int $sampleCount, ?float $confidence, ?string $note): static
    {
        $this->provenanceStatus = $status;
        $this->provenanceSampleCount = $sampleCount;
        $this->provenanceConfidence = $confidence;
        $this->provenanceNote = $note;

        return $this;
    }

    public function copyProvenanceFrom(self $cell): static
    {
        return $this->setProvenance($cell->provenanceStatus, $cell->provenanceSampleCount, $cell->provenanceConfidence, $cell->provenanceNote);
    }
}
