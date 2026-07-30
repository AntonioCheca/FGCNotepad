<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\CharacterReversalRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CharacterReversalRepository::class)]
#[ORM\Table(name: 'character_reversal', schema: 'sf6')]
#[ORM\Index(name: 'idx_character_reversal_character', columns: ['character_id'])]
#[ORM\Index(name: 'idx_character_reversal_move', columns: ['move_id'])]
class CharacterReversal
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'character_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Character $character;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'move_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Move $move;

    #[ORM\Column(type: Types::SMALLINT)]
    private int $startup;

    #[ORM\Column(name: 'reversal_type', length: 32)]
    private string $reversalType;

    /** @var Collection<int, ReversalProperty> */
    #[ORM\OneToMany(targetEntity: ReversalProperty::class, mappedBy: 'reversal', cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $properties;

    public function __construct() { $this->properties = new ArrayCollection(); }
    public function getId(): ?int { return $this->id; }
    public function getCharacter(): Character { return $this->character; }
    public function setCharacter(Character $character): self { $this->character = $character; return $this; }
    public function getMove(): Move { return $this->move; }
    public function setMove(Move $move): self { $this->move = $move; return $this; }
    public function getStartup(): int { return $this->startup; }
    public function setStartup(int $startup): self { $this->startup = $startup; return $this; }
    public function getReversalType(): string { return $this->reversalType; }
    public function setReversalType(string $reversalType): self { $this->reversalType = $reversalType; return $this; }
    /** @return Collection<int, ReversalProperty> */
    public function getProperties(): Collection { return $this->properties; }
    public function addProperty(ReversalProperty $property): self { if (!$this->properties->contains($property)) { $this->properties->add($property); $property->setReversal($this); } return $this; }
}
