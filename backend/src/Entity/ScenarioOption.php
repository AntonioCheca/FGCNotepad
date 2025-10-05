<?php

namespace App\Entity;

use App\Repository\ScenarioOptionRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Table(name: "scenario_option", schema: "sf6")]
#[ORM\Entity(repositoryClass: ScenarioOptionRepository::class)]
class ScenarioOption
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    /**
     * @var Collection<int, ScenarioOptionRelationships>
     */
    #[ORM\OneToMany(targetEntity: ScenarioOptionRelationships::class, mappedBy: 'option', orphanRemoval: true, cascade: ['persist'])]
    private Collection $scenarioOptionRelationships;

    public function __construct()
    {
        $this->scenarioOptionRelationships = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    /**
     * @return Collection<int, ScenarioOptionRelationships>
     */
    public function getScenarioOptionRelationships(): Collection
    {
        return $this->scenarioOptionRelationships;
    }

    public function addScenarioOptionRelationship(ScenarioOptionRelationships $scenarioOptionRelationship): static
    {
        if (!$this->scenarioOptionRelationships->contains($scenarioOptionRelationship)) {
            $this->scenarioOptionRelationships->add($scenarioOptionRelationship);
            $scenarioOptionRelationship->setOption($this);
        }

        return $this;
    }

    public function removeScenarioOptionRelationship(ScenarioOptionRelationships $scenarioOptionRelationship): static
    {
        if ($this->scenarioOptionRelationships->removeElement($scenarioOptionRelationship)) {
            // set the owning side to null (unless already changed)
            if ($scenarioOptionRelationship->getOption() === $this) {
                $scenarioOptionRelationship->setOption(null);
            }
        }

        return $this;
    }
}
