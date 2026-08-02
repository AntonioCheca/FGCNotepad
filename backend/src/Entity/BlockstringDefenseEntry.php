<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'blockstring_defense_entry', schema: 'sf6')]
#[ORM\Index(name: 'idx_blockstring_defense_entry_sequence', columns: ['sequence_id'])]
class BlockstringDefenseEntry
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'defenseEntries')]
    #[ORM\JoinColumn(name: 'sequence_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?BlockstringSequence $sequence = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'gap_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?BlockstringGap $gap = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $instruction = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $exceptionNotes = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'defender_character_id', referencedColumnName: 'id', nullable: true)]
    private ?Character $defenderCharacter = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'move_id', referencedColumnName: 'id', nullable: true)]
    private ?Move $move = null;

    #[ORM\Column(name: 'response_type', type: Types::STRING, length: 40)]
    private string $responseType = 'button';

    #[ORM\Column(type: Types::STRING, length: 40)]
    private string $outcome = 'counter_hit';

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $conversion = null;

    public function getId(): ?int { return $this->id; }
    public function getSequence(): ?BlockstringSequence { return $this->sequence; }
    public function setSequence(?BlockstringSequence $sequence): self { $this->sequence = $sequence; return $this; }
    public function getGap(): ?BlockstringGap { return $this->gap; }
    public function setGap(?BlockstringGap $gap): self { $this->gap = $gap; return $this; }
    public function getInstruction(): ?string { return $this->instruction; }
    public function setInstruction(?string $instruction): self { $this->instruction = $instruction; return $this; }
    public function getExceptionNotes(): ?string { return $this->exceptionNotes; }
    public function setExceptionNotes(?string $exceptionNotes): self { $this->exceptionNotes = $exceptionNotes; return $this; }
    public function getDefenderCharacter(): ?Character { return $this->defenderCharacter; }
    public function setDefenderCharacter(?Character $defenderCharacter): self { $this->defenderCharacter = $defenderCharacter; return $this; }
    public function getMove(): ?Move { return $this->move; }
    public function setMove(?Move $move): self { $this->move = $move; return $this; }
    public function getResponseType(): string { return $this->responseType; }
    public function setResponseType(string $responseType): self { $this->responseType = $responseType; return $this; }
    public function getOutcome(): string { return $this->outcome; }
    public function setOutcome(string $outcome): self { $this->outcome = $outcome; return $this; }
    public function getConversion(): ?string { return $this->conversion; }
    public function setConversion(?string $conversion): self { $this->conversion = $conversion; return $this; }
}
