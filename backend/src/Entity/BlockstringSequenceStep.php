<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * A node of the blockstring pressure graph: one move, shown from a learning layer, optionally with an outcome.
 */
#[ORM\Entity]
#[ORM\Table(name: 'blockstring_sequence_step', schema: 'sf6')]
#[ORM\Index(name: 'idx_blockstring_sequence_step_sequence', columns: ['sequence_id', 'ordinal'])]
#[ORM\Index(name: 'idx_blockstring_sequence_step_move', columns: ['move_id'])]
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
    #[ORM\JoinColumn(name: 'move_id', referencedColumnName: 'id', nullable: false)]
    private ?Move $move = null;

    /** Authoring order; the first node is where the pressure starts. */
    #[ORM\Column]
    private int $ordinal = 1;

    #[ORM\Column(type: Types::SMALLINT, options: ['default' => 1])]
    private int $layer = 1;

    #[ORM\Column(name: 'damage_dealt', nullable: true)]
    private ?int $damageDealt = null;

    #[ORM\Column(name: 'damage_received', nullable: true)]
    private ?int $damageReceived = null;

    public function getId(): ?int { return $this->id; }
    public function getSequence(): ?BlockstringSequence { return $this->sequence; }
    public function setSequence(?BlockstringSequence $sequence): self { $this->sequence = $sequence; return $this; }
    public function getMove(): ?Move { return $this->move; }
    public function setMove(?Move $move): self { $this->move = $move; return $this; }
    public function getOrdinal(): int { return $this->ordinal; }
    public function setOrdinal(int $ordinal): self { $this->ordinal = $ordinal; return $this; }
    public function getLayer(): int { return $this->layer; }
    public function setLayer(int $layer): self { $this->layer = $layer; return $this; }
    public function getDamageDealt(): ?int { return $this->damageDealt; }
    public function setDamageDealt(?int $damageDealt): self { $this->damageDealt = $damageDealt; return $this; }
    public function getDamageReceived(): ?int { return $this->damageReceived; }
    public function setDamageReceived(?int $damageReceived): self { $this->damageReceived = $damageReceived; return $this; }
}
