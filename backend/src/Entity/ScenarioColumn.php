<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Table(name: 'scenario_column', schema: 'sf6')]
#[ORM\Entity]
class ScenarioColumn
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'columns')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Scenario $scenario = null;

    #[ORM\Column(type: Types::INTEGER)]
    private int $position = 0;

    #[ORM\Column(type: Types::TEXT)]
    private string $label = '';

    #[ORM\Column(name: 'summary_value', type: Types::FLOAT, nullable: true)]
    private ?float $summaryValue = null;

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

    public function getPosition(): int
    {
        return $this->position;
    }

    public function setPosition(int $position): static
    {
        $this->position = $position;

        return $this;
    }

    public function getLabel(): string
    {
        return $this->label;
    }

    public function setLabel(string $label): static
    {
        $this->label = $label;

        return $this;
    }

    public function getSummaryValue(): ?float
    {
        return $this->summaryValue;
    }

    public function setSummaryValue(?float $summaryValue): static
    {
        $this->summaryValue = $summaryValue;

        return $this;
    }
}
