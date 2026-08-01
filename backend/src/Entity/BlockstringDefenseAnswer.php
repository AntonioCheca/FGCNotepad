<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'blockstring_defense_answer', schema: 'sf6')]
#[ORM\Index(name: 'idx_blockstring_defense_answer_entry', columns: ['entry_id'])]
#[ORM\Index(name: 'idx_blockstring_defense_answer_defender', columns: ['defender_character_id'])]
class BlockstringDefenseAnswer
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'answers')]
    #[ORM\JoinColumn(name: 'entry_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?BlockstringDefenseEntry $entry = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'defender_character_id', referencedColumnName: 'id', nullable: true)]
    private ?Character $defenderCharacter = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'move_id', referencedColumnName: 'id', nullable: true)]
    private ?Move $move = null;

    #[ORM\Column(name: 'response_type', type: Types::STRING, length: 40)]
    private string $responseType = 'button';

    #[ORM\Column(name: 'startup_frames', nullable: true)]
    private ?int $startupFrames = null;

    #[ORM\Column(type: Types::STRING, length: 40)]
    private string $outcome = 'counter_hit';

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $conversion = null;

    #[ORM\Column(options: ['default' => false])]
    private bool $recommended = false;

    public function getId(): ?int { return $this->id; }
    public function getEntry(): ?BlockstringDefenseEntry { return $this->entry; }
    public function setEntry(?BlockstringDefenseEntry $entry): self { $this->entry = $entry; return $this; }
    public function getDefenderCharacter(): ?Character { return $this->defenderCharacter; }
    public function setDefenderCharacter(?Character $defenderCharacter): self { $this->defenderCharacter = $defenderCharacter; return $this; }
    public function getMove(): ?Move { return $this->move; }
    public function setMove(?Move $move): self { $this->move = $move; return $this; }
    public function getResponseType(): string { return $this->responseType; }
    public function setResponseType(string $responseType): self { $this->responseType = $responseType; return $this; }
    public function getStartupFrames(): ?int { return $this->startupFrames; }
    public function setStartupFrames(?int $startupFrames): self { $this->startupFrames = $startupFrames; return $this; }
    public function getOutcome(): string { return $this->outcome; }
    public function setOutcome(string $outcome): self { $this->outcome = $outcome; return $this; }
    public function getConversion(): ?string { return $this->conversion; }
    public function setConversion(?string $conversion): self { $this->conversion = $conversion; return $this; }
    public function isRecommended(): bool { return $this->recommended; }
    public function setRecommended(bool $recommended): self { $this->recommended = $recommended; return $this; }
}
