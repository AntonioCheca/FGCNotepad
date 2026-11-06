<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * One distinct equilibrium of a resource grid. Probabilities point at row and column positions, because a matrix
 * edit replaces the grid anyway.
 */
#[ORM\Table(name: 'scenario_resource_grid_solution', schema: 'sf6')]
#[ORM\UniqueConstraint(name: 'uniq_scenario_resource_grid_solution_position', columns: ['grid_id', 'position'])]
#[ORM\Entity]
class ScenarioResourceGridSolution
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'solutions')]
    #[ORM\JoinColumn(name: 'grid_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?ScenarioResourceGrid $grid = null;

    #[ORM\Column(type: Types::SMALLINT)]
    private int $position;

    #[ORM\Column(name: 'expected_value', type: Types::FLOAT, nullable: true)]
    private ?float $expectedValue;

    /**
     * @var Collection<int, ScenarioResourceGridProbability>
     */
    #[ORM\OneToMany(mappedBy: 'solution', targetEntity: ScenarioResourceGridProbability::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $probabilities;

    public function __construct(int $position, ?float $expectedValue)
    {
        $this->position = $position;
        $this->expectedValue = $expectedValue;
        $this->probabilities = new ArrayCollection();
    }

    public function setGrid(ScenarioResourceGrid $grid): static
    {
        $this->grid = $grid;

        return $this;
    }

    public function getPosition(): int
    {
        return $this->position;
    }

    public function getExpectedValue(): ?float
    {
        return $this->expectedValue;
    }

    /**
     * @return Collection<int, ScenarioResourceGridProbability>
     */
    public function getProbabilities(): Collection
    {
        return $this->probabilities;
    }

    public function addProbability(string $side, int $axisPosition, float $probability): static
    {
        $this->probabilities->add(new ScenarioResourceGridProbability($this, $side, $axisPosition, $probability));

        return $this;
    }
}
