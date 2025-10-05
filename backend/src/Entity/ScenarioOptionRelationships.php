<?php

namespace App\Entity;

use App\Repository\ScenarioOptionRelationshipsRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Table(name: "scenario_option_relationships", schema: "sf6")]
#[ORM\Entity(repositoryClass: ScenarioOptionRelationshipsRepository::class)]
class ScenarioOptionRelationships
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'scenarioOptionRelationships')]
    #[ORM\JoinColumn(nullable: false)]
    private ?ScenarioOption $option = null;

    #[ORM\ManyToOne(cascade: ['persist'])]
    #[ORM\JoinColumn(nullable: false)]
    private ?ScenarioOptionPart $move = null;

    #[ORM\Column]
    private ?int $index = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getOption(): ?ScenarioOption
    {
        return $this->option;
    }

    public function setOption(?ScenarioOption $option): static
    {
        $this->option = $option;

        return $this;
    }

    public function getMove(): ?ScenarioOptionPart
    {
        return $this->move;
    }

    public function setMove(?ScenarioOptionPart $move): static
    {
        $this->move = $move;

        return $this;
    }

    public function getIndex(): ?int
    {
        return $this->index;
    }

    public function setIndex(int $index): static
    {
        $this->index = $index;

        return $this;
    }
}
