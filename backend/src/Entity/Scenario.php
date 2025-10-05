<?php

namespace App\Entity;

use App\Repository\ScenarioRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Table(name: "scenario", schema: "sf6")]
#[ORM\Entity(repositoryClass: ScenarioRepository::class)]
class Scenario
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $name = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?ScenarioType $type = null;

    /**
     * @var Collection<int, ScenarioLayer>
     */
    #[ORM\OneToMany(mappedBy: 'scenario', targetEntity: ScenarioLayer::class, cascade: ['persist'])]
    private Collection $layers;

    public function __construct()
    {
        $this->layers = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getType(): ?ScenarioType
    {
        return $this->type;
    }

    public function setType(?ScenarioType $type): static
    {
        $this->type = $type;

        return $this;
    }

    /**
     * @return Collection<int, ScenarioLayer>
     */
    public function getLayers(): Collection
    {
        return $this->layers;
    }

    public function addLayer(ScenarioLayer $layer): static
    {
        if (!$this->layers->contains($layer)) {
            $this->layers->add($layer);
            $layer->setScenario($this);
        }

        return $this;
    }

    public function removeLayer(ScenarioLayer $layer): static
    {
        if ($this->layers->removeElement($layer)) {
            // set the owning side to null (unless already changed)
            if ($layer->getScenario() === $this) {
                $layer->setScenario(null);
            }
        }

        return $this;
    }
}
