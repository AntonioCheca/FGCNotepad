<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
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

    #[ORM\Column(name: 'act_after_step', nullable: true)]
    private ?int $actAfterStep = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $instruction = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $exceptionNotes = null;

    /** @var Collection<int, BlockstringDefenseAnswer> */
    #[ORM\OneToMany(targetEntity: BlockstringDefenseAnswer::class, mappedBy: 'entry', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['recommended' => 'DESC', 'id' => 'ASC'])]
    private Collection $answers;

    public function __construct() { $this->answers = new ArrayCollection(); }
    public function getId(): ?int { return $this->id; }
    public function getSequence(): ?BlockstringSequence { return $this->sequence; }
    public function setSequence(?BlockstringSequence $sequence): self { $this->sequence = $sequence; return $this; }
    public function getActAfterStep(): ?int { return $this->actAfterStep; }
    public function setActAfterStep(?int $actAfterStep): self { $this->actAfterStep = $actAfterStep; return $this; }
    public function getInstruction(): ?string { return $this->instruction; }
    public function setInstruction(?string $instruction): self { $this->instruction = $instruction; return $this; }
    public function getExceptionNotes(): ?string { return $this->exceptionNotes; }
    public function setExceptionNotes(?string $exceptionNotes): self { $this->exceptionNotes = $exceptionNotes; return $this; }
    /** @return Collection<int, BlockstringDefenseAnswer> */ public function getAnswers(): Collection { return $this->answers; }
    public function addAnswer(BlockstringDefenseAnswer $answer): self { if (!$this->answers->contains($answer)) { $this->answers->add($answer); $answer->setEntry($this); } return $this; }
}
