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

    #[ORM\Column(name: 'starter_context', type: Types::STRING, length: 24, nullable: true)]
    private ?string $starterContext = null;

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

    public function getStarterContext(): ?string
    {
        return $this->starterContext;
    }

    public function setStarterContext(?string $starterContext): static
    {
        $this->starterContext = $starterContext;

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
}
