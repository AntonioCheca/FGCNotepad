<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * Equilibrium of one matrix layer, stored on save with the standard execution mode and no resource limits.
 * Anonymous visitors read this instead of triggering a live solve.
 */
#[ORM\Table(name: 'scenario_layer_solution', schema: 'sf6')]
#[ORM\UniqueConstraint(name: 'uniq_scenario_layer_solution_layer', columns: ['scenario_id', 'layer'])]
#[ORM\Entity]
class ScenarioLayerSolution
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'layerSolutions')]
    #[ORM\JoinColumn(name: 'scenario_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?Scenario $scenario = null;

    #[ORM\Column(type: Types::INTEGER)]
    private int $layer;

    #[ORM\Column(name: 'expected_value', type: Types::FLOAT, nullable: true)]
    private ?float $expectedValue;

    #[ORM\Column(name: 'solved_at', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $solvedAt;

    /**
     * @var Collection<int, ScenarioLayerSolutionRow>
     */
    #[ORM\OneToMany(mappedBy: 'solution', targetEntity: ScenarioLayerSolutionRow::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $rowProbabilities;

    /**
     * @var Collection<int, ScenarioLayerSolutionColumn>
     */
    #[ORM\OneToMany(mappedBy: 'solution', targetEntity: ScenarioLayerSolutionColumn::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $columnProbabilities;

    public function __construct(int $layer, ?float $expectedValue, \DateTimeImmutable $solvedAt)
    {
        $this->layer = $layer;
        $this->expectedValue = $expectedValue;
        $this->solvedAt = $solvedAt;
        $this->rowProbabilities = new ArrayCollection();
        $this->columnProbabilities = new ArrayCollection();
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

    public function getLayer(): int
    {
        return $this->layer;
    }

    public function getExpectedValue(): ?float
    {
        return $this->expectedValue;
    }

    public function getSolvedAt(): \DateTimeImmutable
    {
        return $this->solvedAt;
    }

    public function replaceResult(?float $expectedValue, \DateTimeImmutable $solvedAt): static
    {
        $this->expectedValue = $expectedValue;
        $this->solvedAt = $solvedAt;
        $this->rowProbabilities->clear();
        $this->columnProbabilities->clear();

        return $this;
    }

    /**
     * @return Collection<int, ScenarioLayerSolutionRow>
     */
    public function getRowProbabilities(): Collection
    {
        return $this->rowProbabilities;
    }

    public function addRowProbability(ScenarioRow $row, float $probability): static
    {
        $this->rowProbabilities->add(new ScenarioLayerSolutionRow($this, $row, $probability));

        return $this;
    }

    /**
     * @return Collection<int, ScenarioLayerSolutionColumn>
     */
    public function getColumnProbabilities(): Collection
    {
        return $this->columnProbabilities;
    }

    public function addColumnProbability(ScenarioColumn $column, float $probability): static
    {
        $this->columnProbabilities->add(new ScenarioLayerSolutionColumn($this, $column, $probability));

        return $this;
    }
}
