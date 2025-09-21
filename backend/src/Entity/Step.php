<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\StepRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: StepRepository::class)]
#[ORM\Table(name: "step_combo", schema: "sf6")]
class Step
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'steps')]
    #[ORM\JoinColumn(name: "parent_sequence_id", referencedColumnName: "id", nullable: false)]
    private ?ComboSequences $parent_sequence = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?ComboSequences $child_sequence = null;

    #[ORM\Column]
    private ?int $ordinal_in_combo = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?ConnectionType $connection_type = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getParentSequence(): ?ComboSequences
    {
        return $this->parent_sequence;
    }

    public function setParentSequence(?ComboSequences $parent_sequence): static
    {
        $this->parent_sequence = $parent_sequence;

        return $this;
    }

    public function getChildSequence(): ?ComboSequences
    {
        return $this->child_sequence;
    }

    public function setChildSequence(?ComboSequences $child_sequence): static
    {
        $this->child_sequence = $child_sequence;

        return $this;
    }

    public function getOrdinalInCombo(): ?int
    {
        return $this->ordinal_in_combo;
    }

    public function setOrdinalInCombo(int $ordinal_in_combo): static
    {
        $this->ordinal_in_combo = $ordinal_in_combo;

        return $this;
    }

    public function getConnectionType(): ?ConnectionType
    {
        return $this->connection_type;
    }

    public function setConnectionType(?ConnectionType $connection_type): static
    {
        $this->connection_type = $connection_type;

        return $this;
    }
}
