<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Table(name: 'scenario_layer_solution_column', schema: 'sf6')]
#[ORM\Index(name: 'idx_scenario_layer_solution_column_solution', columns: ['solution_id'])]
#[ORM\Index(name: 'idx_scenario_layer_solution_column_column', columns: ['column_id'])]
#[ORM\Entity]
class ScenarioLayerSolutionColumn
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'columnProbabilities')]
    #[ORM\JoinColumn(name: 'solution_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ScenarioLayerSolution $solution;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'column_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ScenarioColumn $column;

    #[ORM\Column(type: Types::FLOAT)]
    private float $probability;

    public function __construct(ScenarioLayerSolution $solution, ScenarioColumn $column, float $probability)
    {
        $this->solution = $solution;
        $this->column = $column;
        $this->probability = $probability;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getSolution(): ScenarioLayerSolution
    {
        return $this->solution;
    }

    public function getColumn(): ScenarioColumn
    {
        return $this->column;
    }

    public function getProbability(): float
    {
        return $this->probability;
    }
}
