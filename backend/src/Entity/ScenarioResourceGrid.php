<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * A scenario's equilibrium precomputed for every combination of both players' Drive, Super and one stock-like
 * character object, and of the corner-specific combos toggle when the scenario has no position lock, so anonymous
 * readers can move resource sliders without a live solve.
 *
 * Combinations are numbered in a fixed axis order (see ScenarioResourceGridAxes) and stored as runs: each run
 * starts at a combination index and lasts until the next run, all sharing one solution.
 */
#[ORM\Table(name: 'scenario_resource_grid', schema: 'sf6')]
#[ORM\UniqueConstraint(name: 'uniq_scenario_resource_grid_scenario', columns: ['scenario_id'])]
#[ORM\Entity]
class ScenarioResourceGrid
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToOne(targetEntity: Scenario::class)]
    #[ORM\JoinColumn(name: 'scenario_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Scenario $scenario;

    #[ORM\Column(name: 'computed_at', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $computedAt;

    #[ORM\Column(name: 'attacker_object_key', type: Types::STRING, length: 64, nullable: true)]
    private ?string $attackerObjectKey;

    #[ORM\Column(name: 'attacker_object_max', type: Types::SMALLINT)]
    private int $attackerObjectMax;

    #[ORM\Column(name: 'defender_object_key', type: Types::STRING, length: 64, nullable: true)]
    private ?string $defenderObjectKey;

    #[ORM\Column(name: 'defender_object_max', type: Types::SMALLINT)]
    private int $defenderObjectMax;

    #[ORM\Column(name: 'corner_toggle', type: Types::BOOLEAN)]
    private bool $cornerToggle;

    /**
     * @var Collection<int, ScenarioResourceGridSolution>
     */
    #[ORM\OneToMany(mappedBy: 'grid', targetEntity: ScenarioResourceGridSolution::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['position' => 'ASC'])]
    private Collection $solutions;

    /**
     * @var Collection<int, ScenarioResourceGridRun>
     */
    #[ORM\OneToMany(mappedBy: 'grid', targetEntity: ScenarioResourceGridRun::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['startIndex' => 'ASC'])]
    private Collection $runs;

    public function __construct(Scenario $scenario, ScenarioResourceGridAxes $axes, \DateTimeImmutable $computedAt)
    {
        $this->scenario = $scenario;
        $this->computedAt = $computedAt;
        $this->attackerObjectKey = $axes->attackerObjectKey;
        $this->attackerObjectMax = $axes->attackerObjectMax;
        $this->defenderObjectKey = $axes->defenderObjectKey;
        $this->defenderObjectMax = $axes->defenderObjectMax;
        $this->cornerToggle = $axes->cornerToggle;
        $this->solutions = new ArrayCollection();
        $this->runs = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getScenario(): Scenario
    {
        return $this->scenario;
    }

    public function getComputedAt(): \DateTimeImmutable
    {
        return $this->computedAt;
    }

    public function getAxes(): ScenarioResourceGridAxes
    {
        return new ScenarioResourceGridAxes($this->attackerObjectKey, $this->attackerObjectMax, $this->defenderObjectKey, $this->defenderObjectMax, $this->cornerToggle);
    }

    /**
     * @return Collection<int, ScenarioResourceGridSolution>
     */
    public function getSolutions(): Collection
    {
        return $this->solutions;
    }

    public function addSolution(ScenarioResourceGridSolution $solution): static
    {
        $this->solutions->add($solution);
        $solution->setGrid($this);

        return $this;
    }

    /**
     * @return Collection<int, ScenarioResourceGridRun>
     */
    public function getRuns(): Collection
    {
        return $this->runs;
    }

    public function addRun(int $startIndex, int $solutionPosition): static
    {
        $run = new ScenarioResourceGridRun($startIndex, $solutionPosition);
        $run->setGrid($this);
        $this->runs->add($run);

        return $this;
    }
}
