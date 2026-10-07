<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * One ordered chunk of a blockstring lesson: a small graph plus when it applies ("if they start mashing...").
 */
#[ORM\Entity]
#[ORM\Table(name: 'blockstring_block', schema: 'sf6')]
#[ORM\Index(name: 'idx_blockstring_block_sequence', columns: ['sequence_id', 'ordinal'])]
class BlockstringBlock
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'blocks')]
    #[ORM\JoinColumn(name: 'sequence_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?BlockstringSequence $sequence = null;

    #[ORM\Column(type: Types::SMALLINT)]
    private int $ordinal = 1;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    public function getId(): ?int { return $this->id; }
    public function getSequence(): ?BlockstringSequence { return $this->sequence; }
    public function setSequence(?BlockstringSequence $sequence): self { $this->sequence = $sequence; return $this; }
    public function getOrdinal(): int { return $this->ordinal; }
    public function setOrdinal(int $ordinal): self { $this->ordinal = $ordinal; return $this; }
    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $description): self { $this->description = $description; return $this; }
}
