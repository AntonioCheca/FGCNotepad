<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\ComboSequencesRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ComboSequencesRepository::class)]
#[ORM\Table(name: "combo_sequence", schema: "sf6")]
class ComboSequences
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $name = null;

    #[ORM\Column(type: Types::TEXT)]
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
        // set the owning side of the relation if necessary
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
        // set the owning side of the relation if necessary
        if ($comboRequirement->getSequence() !== $this) {
            $comboRequirement->setSequence($this);
        }

        $this->comboRequirement = $comboRequirement;

        return $this;
    }
}
