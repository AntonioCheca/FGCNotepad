<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\ComboSequencesRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: ComboSequencesRepository::class)]
#[ORM\Table(name: "combo_sequence", schema: "sf6")]
class ComboSequences
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['combo:read'])]
    private ?int $id = null;

    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['combo:read'])]
    private ?string $name = null;

    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['combo:read'])]
    private ?string $description = null;

    #[ORM\OneToOne(inversedBy: 'comboSequence', cascade: ['persist', 'remove'])]
    private ?Move $move = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?ComboSequenceType $type = null;

    #[ORM\OneToOne(mappedBy: 'sequence', cascade: ['persist', 'remove'])]
    private ?ComboMetrics $comboMetrics = null;

    #[ORM\OneToOne(mappedBy: 'sequence', cascade: ['persist', 'remove'])]
    private ?ComboRequirement $comboRequirement = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?Visibility $visibility = null;

    /**
     * @var Collection<int, Season>
     */
    #[ORM\ManyToMany(targetEntity: Season::class)]
    #[ORM\JoinTable(
        name: "sf6.season_combo_sequence",
    )]
    #[Groups(['combo:read'])]
    private Collection $season;

    public function __construct()
    {
        $this->season = new ArrayCollection();
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

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(string $description): static
    {
        $this->description = $description;

        return $this;
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

    public function getType(): ?ComboSequenceType
    {
        return $this->type;
    }

    public function setType(?ComboSequenceType $type): static
    {
        $this->type = $type;

        return $this;
    }

    public function getComboMetrics(): ?ComboMetrics
    {
        return $this->comboMetrics;
    }

    public function setComboMetrics(ComboMetrics $comboMetrics): static
    {
        if ($comboMetrics->getSequence() !== $this) {
            $comboMetrics->setSequence($this);
        }

        $this->comboMetrics = $comboMetrics;

        return $this;
    }

    public function getComboRequirement(): ?ComboRequirement
    {
        return $this->comboRequirement;
    }

    public function setComboRequirement(ComboRequirement $comboRequirement): static
    {
        if ($comboRequirement->getSequence() !== $this) {
            $comboRequirement->setSequence($this);
        }

        $this->comboRequirement = $comboRequirement;

        return $this;
    }

    public function getVisibility(): ?Visibility
    {
        return $this->visibility;
    }

    public function setVisibility(?Visibility $visibility): static
    {
        $this->visibility = $visibility;

        return $this;
    }

    /**
     * @return Collection<int, Season>
     */
    public function getSeason(): Collection
    {
        return $this->season;
    }

    public function addSeason(Season $season): static
    {
        if (!$this->season->contains($season)) {
            $this->season->add($season);
        }

        return $this;
    }

    public function removeSeason(Season $season): static
    {
        $this->season->removeElement($season);

        return $this;
    }
}
