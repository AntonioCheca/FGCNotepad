<?php

namespace App\Entity;

use App\Repository\ScenarioLayerRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Table(name: "scenario_layer", schema: "sf6")]
#[ORM\Entity(repositoryClass: ScenarioLayerRepository::class)]
class ScenarioLayer
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column]
    private ?int $index = null;

    #[ORM\ManyToOne(inversedBy: 'layers')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Scenario $scenario = null;

    /**
     * @var Collection<int, ScenarioOption>
     */
    #[ORM\ManyToMany(targetEntity: ScenarioOption::class, cascade: ['persist'])]
    #[ORM\JoinTable(
        name: "sf6.scenario_layer_first_options",
        joinColumns: [new ORM\JoinColumn(name: "layer_id", referencedColumnName: "id", onDelete: "CASCADE")],
        inverseJoinColumns: [new ORM\JoinColumn(name: "option_id", referencedColumnName: "id", onDelete: "CASCADE")]
    )]
    private Collection $firstPlayerOptions;

    /**
     * @var Collection<int, ScenarioOption>
     */
    #[ORM\ManyToMany(targetEntity: ScenarioOption::class, cascade: ['persist'])]
    #[ORM\JoinTable(
        name: "sf6.scenario_layer_second_options",
        joinColumns: [new ORM\JoinColumn(name: "layer_id", referencedColumnName: "id", onDelete: "CASCADE")],
        inverseJoinColumns: [new ORM\JoinColumn(name: "option_id", referencedColumnName: "id", onDelete: "CASCADE")]
    )]
    private Collection $secondPlayerOptions;


    public function __construct()
    {
        $this->firstPlayerOptions = new ArrayCollection();
        $this->secondPlayerOptions = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
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

    public function getScenario(): ?Scenario
    {
        return $this->scenario;
    }

    public function setScenario(?Scenario $scenario): static
    {
        $this->scenario = $scenario;

        return $this;
    }

    /**
     * @return Collection<int, ScenarioOption>
     */
    public function getFirstPlayerOptions(): Collection
    {
        return $this->firstPlayerOptions;
    }

    public function addFirstPlayerOption(ScenarioOption $firstPlayerOption): static
    {
        if (!$this->firstPlayerOptions->contains($firstPlayerOption)) {
            $this->firstPlayerOptions->add($firstPlayerOption);
        }

        return $this;
    }

    public function removeFirstPlayerOption(ScenarioOption $firstPlayerOption): static
    {
        $this->firstPlayerOptions->removeElement($firstPlayerOption);

        return $this;
    }

    /**
     * @return Collection<int, ScenarioOption>
     */
    public function getSecondPlayerOptions(): Collection
    {
        return $this->secondPlayerOptions;
    }

    public function addSecondPlayerOption(ScenarioOption $secondPlayerOption): static
    {
        if (!$this->secondPlayerOptions->contains($secondPlayerOption)) {
            $this->secondPlayerOptions->add($secondPlayerOption);
        }

        return $this;
    }

    public function removeSecondPlayerOption(ScenarioOption $secondPlayerOption): static
    {
        $this->secondPlayerOptions->removeElement($secondPlayerOption);

        return $this;
    }
}
