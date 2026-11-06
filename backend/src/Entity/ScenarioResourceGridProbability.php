<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Table(name: 'scenario_resource_grid_probability', schema: 'sf6')]
#[ORM\Index(name: 'idx_scenario_resource_grid_probability_solution', columns: ['solution_id'])]
#[ORM\Entity]
class ScenarioResourceGridProbability
{
    public const SIDE_ROW = 'row';
    public const SIDE_COLUMN = 'column';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'probabilities')]
    #[ORM\JoinColumn(name: 'solution_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ScenarioResourceGridSolution $solution;

    #[ORM\Column(type: Types::STRING, length: 8)]
    private string $side;

    #[ORM\Column(name: 'axis_position', type: Types::SMALLINT)]
    private int $axisPosition;

    #[ORM\Column(type: Types::FLOAT)]
    private float $probability;

    public function __construct(ScenarioResourceGridSolution $solution, string $side, int $axisPosition, float $probability)
    {
        $this->solution = $solution;
        $this->side = $side;
        $this->axisPosition = $axisPosition;
        $this->probability = $probability;
    }

    public function getSide(): string
    {
        return $this->side;
    }

    public function getAxisPosition(): int
    {
        return $this->axisPosition;
    }

    public function getProbability(): float
    {
        return $this->probability;
    }
}
