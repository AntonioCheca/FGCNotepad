<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Table(name: 'scenario_row', schema: 'sf6')]
#[ORM\Entity]
class ScenarioRow
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'rows')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Scenario $scenario = null;

    #[ORM\Column(type: Types::INTEGER)]
    private int $position = 0;

    #[ORM\Column(type: Types::TEXT)]
    private string $label = '';

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    /** Share of observed situations where this option was picked; only imported scenarios carry it. */
    #[ORM\Column(name: 'seen_frequency', type: Types::FLOAT, nullable: true)]
    private ?float $seenFrequency = null;

    #[ORM\Column(name: 'seen_sample_count', type: Types::INTEGER, nullable: true)]
    private ?int $seenSampleCount = null;

    #[ORM\Column(type: Types::INTEGER)]
    private int $layer = 1;

    #[ORM\Column(name: 'summary_value', type: Types::FLOAT, nullable: true)]
    private ?float $summaryValue = null;

    /**
     * @var Collection<int, ScenarioRowResourceRequirement>
     */
    #[ORM\OneToMany(mappedBy: 'row', targetEntity: ScenarioRowResourceRequirement::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['position' => 'ASC'])]
    private Collection $resourceRequirements;

    public function __construct()
    {
        $this->resourceRequirements = new ArrayCollection();
    }

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

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getSeenFrequency(): ?float
    {
        return $this->seenFrequency;
    }

    public function getSeenSampleCount(): ?int
    {
        return $this->seenSampleCount;
    }

    public function setSeenStats(?float $frequency, ?int $sampleCount): static
    {
        $this->seenFrequency = $frequency;
        $this->seenSampleCount = null === $frequency ? null : $sampleCount;

        return $this;
    }

    /**
     * Copies what the editor payload does not carry: the description and the seen stats.
     */
    public function copyAnnotationsFrom(self $previous): static
    {
        $this->description = $previous->getDescription();

        return $this->setSeenStats($previous->getSeenFrequency(), $previous->getSeenSampleCount());
    }

    public function getLayer(): int
    {
        return $this->layer;
    }

    public function setLayer(int $layer): static
    {
        $this->layer = $layer;

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

    /**
     * @return Collection<int, ScenarioRowResourceRequirement>
     */
    public function getResourceRequirements(): Collection
    {
        return $this->resourceRequirements;
    }

    public function addResourceRequirement(ScenarioRowResourceRequirement $requirement): static
    {
        if (!$this->resourceRequirements->contains($requirement)) {
            $this->resourceRequirements->add($requirement);
            $requirement->setRow($this);
        }

        return $this;
    }
}
