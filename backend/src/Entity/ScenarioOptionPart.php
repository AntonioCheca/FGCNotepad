<?php

namespace App\Entity;

use App\Repository\ScenarioOptionPartRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Table(name: "scenario_option_part", schema: "sf6")]
#[ORM\Entity(repositoryClass: ScenarioOptionPartRepository::class)]
class ScenarioOptionPart
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?Move $move = null;

    #[ORM\Column]
    private ?int $framesOfDuration = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getMove(): ?Move
    {
        return $this->move;
    }

    public function setMove(?Move $move): static
    {
        $this->move = $move;

        return $this;
    }

    public function getFramesOfDuration(): ?int
    {
        return $this->framesOfDuration;
    }

    public function setFramesOfDuration(int $framesOfDuration): static
    {
        $this->framesOfDuration = $framesOfDuration;

        return $this;
    }
}
