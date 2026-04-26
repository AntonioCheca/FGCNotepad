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
    #[Groups(['combo:read'])]
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

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'author_id', referencedColumnName: 'id', nullable: true)]
    private ?User $author = null;

    /**
     * @var Collection<int, Season>
     */
    #[ORM\ManyToMany(targetEntity: Season::class)]
    #[ORM\JoinTable(
        name: "sf6.season_combo_sequence",
    )]
    #[Groups(['combo:read'])]
    private Collection $season;

    /**
     * @var Collection<int, Step>
     */
    #[ORM\OneToMany(targetEntity: Step::class, mappedBy: 'parent_sequence', cascade: ['persist', 'remove'], fetch: 'EAGER')]
    private Collection $steps;

    #[ORM\Column(name: 'is_essential', type: Types::BOOLEAN, options: ['default' => false])]
    private bool $isEssential = false;

    public function __construct()
    {
        // Force initialize the properties that Doctrine will access
        if (!isset($this->season)) {
            $this->season = new ArrayCollection();
        }
        if (!isset($this->steps)) {
            $this->steps = new ArrayCollection();
        }
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

    public function getAuthor(): ?User
    {
        return $this->author;
    }

    public function setAuthor(?User $author): static
    {
        $this->author = $author;

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

    /**
     * @return Collection<int, Step>
     */
    public function getSteps(): Collection
    {
        return $this->steps;
    }

    public function addStep(Step $step): static
    {
        if (!$this->steps->contains($step)) {
            $this->steps->add($step);
            $step->setParentSequence($this);
        }

        return $this;
    }

    public function removeStep(Step $step): static
    {
        if ($this->steps->removeElement($step)) {
            if ($step->getParentSequence() === $this) {
                $step->setParentSequence(null);
            }
        }

        return $this;
    }

    public function getCharacter(): ?Character
    {
        if (null !== $this->move) {
            return $this->move->getCharacter();
        }

        if ($this->getSteps()->count() > 0) {
            return $this->getSteps()->first()->getChildSequence()->getCharacter();
        }

        return null;
    }

    public function __wakeup()
    {
        error_log('__wakeup called on ' . __CLASS__);
        $this->__construct();
    }

    public function isEssential(): bool
    {
        return $this->isEssential;
    }

    public function setIsEssential(bool $isEssential): static
    {
        $this->isEssential = $isEssential;

        return $this;
    }
}
