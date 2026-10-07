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

    /** The name players use for the move (FAT's cmnName, such as "MK Tatsu"). */
    #[ORM\Column(name: 'common_name', type: Types::TEXT, nullable: true)]
    private ?string $commonName = null;

    #[ORM\Column(name: 'available_on_modern', type: Types::BOOLEAN, options: ['default' => true])]
    private bool $availableOnModern = true;

    #[ORM\Column(name: 'modern_max_notation', type: Types::TEXT, nullable: true)]
    private ?string $modernMaxNotation = null;

    #[ORM\Column(name: 'modern_simple_notation', type: Types::TEXT, nullable: true)]
    private ?string $modernSimpleNotation = null;

    /** Share of the move's damage dealt when performed with its simple Modern input; null means no penalty. */
    #[ORM\Column(name: 'modern_simple_damage_percent', type: Types::SMALLINT, nullable: true)]
    private ?int $modernSimpleDamagePercent = null;

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

    public function getCommonName(): ?string
    {
        return $this->commonName;
    }

    public function setCommonName(?string $commonName): static
    {
        $this->commonName = null === $commonName || '' === trim($commonName) ? null : trim($commonName);

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

    public function isAvailableOnModern(): bool
    {
        return $this->availableOnModern;
    }

    public function setAvailableOnModern(bool $availableOnModern): static
    {
        $this->availableOnModern = $availableOnModern;

        return $this;
    }

    public function getModernMaxNotation(): ?string
    {
        return $this->modernMaxNotation;
    }

    public function setModernMaxNotation(?string $modernMaxNotation): static
    {
        $this->modernMaxNotation = $modernMaxNotation;

        return $this;
    }

    public function getModernSimpleNotation(): ?string
    {
        return $this->modernSimpleNotation;
    }

    public function setModernSimpleNotation(?string $modernSimpleNotation): static
    {
        $this->modernSimpleNotation = $modernSimpleNotation;

        return $this;
    }

    public function getModernSimpleDamagePercent(): ?int
    {
        return $this->modernSimpleDamagePercent;
    }

    public function setModernSimpleDamagePercent(?int $modernSimpleDamagePercent): static
    {
        $this->modernSimpleDamagePercent = $modernSimpleDamagePercent;

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
