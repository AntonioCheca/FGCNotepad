<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Serializer\Attribute\MaxDepth;

#[ORM\Table(name: "move", schema: "sf6")]
#[ORM\Entity]
class Move extends Component
{
    #[Groups(["move:read", "character:read", "combo:read"])]
    #[ORM\Column(type: Types::TEXT)]
    private string $numpadNotation;

    #[ORM\ManyToOne(inversedBy: 'moves')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(["move:read", "combo:read"])]
    #[MaxDepth(1)]
    private Character $character;

    #[ORM\OneToOne(inversedBy: 'move', cascade: ['persist', 'remove'])]
    private ?FrameData $frameData = null;

    #[ORM\OneToOne(mappedBy: 'move', cascade: ['persist', 'remove'])]
    private ?ComboSequences $comboSequence = null;

    public function getNumpadNotation(): string
    {
        return $this->numpadNotation;
    }

    public function setNumpadNotation(string $numpadNotation): self
    {
        $this->numpadNotation = $numpadNotation;
        return $this;
    }

    public function getCharacter(): Character
    {
        return $this->character;
    }

    public function setCharacter(Character $character): static
    {
        $this->character = $character;

        return $this;
    }

    public function getFrameData(): ?FrameData
    {
        return $this->frameData;
    }

    public function setFrameData(?FrameData $frameData): static
    {
        $this->frameData = $frameData;

        return $this;
    }

    public function getComboSequence(): ?ComboSequences
    {
        return $this->comboSequence;
    }

    public function setComboSequence(?ComboSequences $comboSequence): static
    {
        // unset the owning side of the relation if necessary
        if ($comboSequence === null && $this->comboSequence !== null) {
            $this->comboSequence->setMove(null);
        }

        // set the owning side of the relation if necessary
        if ($comboSequence !== null && $comboSequence->getMove() !== $this) {
            $comboSequence->setMove($this);
        }

        $this->comboSequence = $comboSequence;

        return $this;
    }

    public function getName(): string
    {
        return sprintf('%s - %s', $this->character->getName(), $this->numpadNotation);
    }
}
