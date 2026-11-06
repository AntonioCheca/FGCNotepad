<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Table(name: 'scenario_resource_grid_run', schema: 'sf6')]
#[ORM\UniqueConstraint(name: 'uniq_scenario_resource_grid_run_start', columns: ['grid_id', 'start_index'])]
#[ORM\Entity]
class ScenarioResourceGridRun
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'runs')]
    #[ORM\JoinColumn(name: 'grid_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?ScenarioResourceGrid $grid = null;

    #[ORM\Column(name: 'start_index', type: Types::INTEGER)]
    private int $startIndex;

    #[ORM\Column(name: 'solution_position', type: Types::SMALLINT)]
    private int $solutionPosition;

    public function __construct(int $startIndex, int $solutionPosition)
    {
        $this->startIndex = $startIndex;
        $this->solutionPosition = $solutionPosition;
    }

    public function setGrid(ScenarioResourceGrid $grid): static
    {
        $this->grid = $grid;

        return $this;
    }

    public function getStartIndex(): int
    {
        return $this->startIndex;
    }

    public function getSolutionPosition(): int
    {
        return $this->solutionPosition;
    }
}
