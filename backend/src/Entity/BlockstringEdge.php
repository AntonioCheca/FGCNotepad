<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * A directed transition between two blockstring nodes. Branches may split, reconnect or loop.
 */
#[ORM\Entity]
#[ORM\Table(name: 'blockstring_edge', schema: 'sf6')]
#[ORM\Index(name: 'idx_blockstring_edge_sequence', columns: ['sequence_id'])]
#[ORM\Index(name: 'idx_blockstring_edge_from', columns: ['from_step_id'])]
#[ORM\Index(name: 'idx_blockstring_edge_to', columns: ['to_step_id'])]
class BlockstringEdge
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'edges')]
    #[ORM\JoinColumn(name: 'sequence_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?BlockstringSequence $sequence = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'from_step_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?BlockstringSequenceStep $fromStep = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'to_step_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?BlockstringSequenceStep $toStep = null;

    #[ORM\Column(length: 16, options: ['default' => 'normal'])]
    private string $kind = 'normal';

    #[ORM\Column(name: 'read_label', length: 48, nullable: true)]
    private ?string $readLabel = null;

    #[ORM\Column(type: Types::SMALLINT, options: ['default' => 1])]
    private int $layer = 1;

    /** Attacker frame advantage when the source move is blocked. */
    #[ORM\Column(name: 'frame_advantage', type: Types::SMALLINT, nullable: true)]
    private ?int $frameAdvantage = null;

    /** Frames the defender can act in before the destination move. */
    #[ORM\Column(name: 'gap_frames', type: Types::SMALLINT, nullable: true)]
    private ?int $gapFrames = null;

    public function getId(): ?int { return $this->id; }
    public function getSequence(): ?BlockstringSequence { return $this->sequence; }
    public function setSequence(?BlockstringSequence $sequence): self { $this->sequence = $sequence; return $this; }
    public function getFromStep(): ?BlockstringSequenceStep { return $this->fromStep; }
    public function setFromStep(BlockstringSequenceStep $fromStep): self { $this->fromStep = $fromStep; return $this; }
    public function getToStep(): ?BlockstringSequenceStep { return $this->toStep; }
    public function setToStep(BlockstringSequenceStep $toStep): self { $this->toStep = $toStep; return $this; }
    public function getKind(): string { return $this->kind; }
    public function setKind(string $kind): self { $this->kind = $kind; return $this; }
    public function getReadLabel(): ?string { return $this->readLabel; }
    public function setReadLabel(?string $readLabel): self { $this->readLabel = $readLabel; return $this; }
    public function getLayer(): int { return $this->layer; }
    public function setLayer(int $layer): self { $this->layer = $layer; return $this; }
    public function getFrameAdvantage(): ?int { return $this->frameAdvantage; }
    public function setFrameAdvantage(?int $frameAdvantage): self { $this->frameAdvantage = $frameAdvantage; return $this; }
    public function getGapFrames(): ?int { return $this->gapFrames; }
    public function setGapFrames(?int $gapFrames): self { $this->gapFrames = $gapFrames; return $this; }
}
