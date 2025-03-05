<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Table(name: "move", schema: "sf6")]
#[ORM\Entity]
class Move extends Component
{
    #[Groups(["move:read", "character:read"])]
    #[ORM\Column(type: Types::TEXT)]
    private string $numpadNotation;

    #[ORM\ManyToOne(inversedBy: 'moves')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(["move:read"])]
    private ?Character $character = null;

    #[ORM\OneToOne(inversedBy: 'move', cascade: ['persist', 'remove'])]
    private ?FrameData $frameData = null;

    public function getNumpadNotation(): string
    {
        return $this->numpadNotation;
    }

    public function setNumpadNotation(string $numpadNotation): self
    {
        $this->numpadNotation = $numpadNotation;
        return $this;
    }

    public function getCharacter(): ?Character
    {
        return $this->character;
    }

    public function setCharacter(?Character $character): static
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
}
