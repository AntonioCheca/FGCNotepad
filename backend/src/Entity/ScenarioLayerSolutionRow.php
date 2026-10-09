<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Table(name: 'scenario_layer_solution_row', schema: 'sf6')]
#[ORM\Index(name: 'idx_scenario_layer_solution_row_solution', columns: ['solution_id'])]
#[ORM\Index(name: 'idx_scenario_layer_solution_row_row', columns: ['row_id'])]
#[ORM\Entity]
class ScenarioLayerSolutionRow
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'rowProbabilities')]
    #[ORM\JoinColumn(name: 'solution_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ScenarioLayerSolution $solution;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'row_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ScenarioRow $row;

    #[ORM\Column(type: Types::FLOAT)]
    private float $probability;

    public function __construct(ScenarioLayerSolution $solution, ScenarioRow $row, float $probability)
    {
        $this->solution = $solution;
        $this->row = $row;
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

    public function getRow(): ScenarioRow
    {
        return $this->row;
    }

    public function getProbability(): float
    {
        return $this->probability;
    }
}
