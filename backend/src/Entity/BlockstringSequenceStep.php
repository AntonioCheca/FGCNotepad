<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * A node of a blockstring block's graph: one move, with the attacker's frame advantage once it is blocked.
 */
#[ORM\Entity]
#[ORM\Table(name: 'blockstring_sequence_step', schema: 'sf6')]
#[ORM\Index(name: 'idx_blockstring_sequence_step_sequence', columns: ['sequence_id', 'ordinal'])]
#[ORM\Index(name: 'idx_blockstring_sequence_step_move', columns: ['move_id'])]
#[ORM\Index(name: 'idx_blockstring_sequence_step_block', columns: ['block_id'])]
class BlockstringSequenceStep
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'steps')]
    #[ORM\JoinColumn(name: 'sequence_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?BlockstringSequence $sequence = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'block_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?BlockstringBlock $block = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'move_id', referencedColumnName: 'id', nullable: false)]
    private ?Move $move = null;

    #[ORM\Column]
    private int $ordinal = 1;

    /** Authored by hand: Drive Rush, spacing or Burnout change the frame data value. */
    #[ORM\Column(name: 'frame_advantage', type: Types::SMALLINT, nullable: true)]
    private ?int $frameAdvantage = null;

    public function getId(): ?int { return $this->id; }
    public function getSequence(): ?BlockstringSequence { return $this->sequence; }
    public function setSequence(?BlockstringSequence $sequence): self { $this->sequence = $sequence; return $this; }
    public function getBlock(): ?BlockstringBlock { return $this->block; }
    public function setBlock(?BlockstringBlock $block): self { $this->block = $block; return $this; }
    public function getMove(): ?Move { return $this->move; }
    public function setMove(?Move $move): self { $this->move = $move; return $this; }
    public function getOrdinal(): int { return $this->ordinal; }
    public function setOrdinal(int $ordinal): self { $this->ordinal = $ordinal; return $this; }
    public function getFrameAdvantage(): ?int { return $this->frameAdvantage; }
    public function setFrameAdvantage(?int $frameAdvantage): self { $this->frameAdvantage = $frameAdvantage; return $this; }
}
