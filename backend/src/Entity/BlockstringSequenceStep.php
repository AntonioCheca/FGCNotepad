<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

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

    #[ORM\ManyToOne(inversedBy: 'steps')]
    #[ORM\JoinColumn(name: 'route_id', referencedColumnName: 'id', nullable: true, onDelete: 'CASCADE')]
    private ?BlockstringRoute $route = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'move_id', referencedColumnName: 'id', nullable: false)]
    private ?Move $move = null;

    #[ORM\Column]
    private int $ordinal = 1;

    #[ORM\Column(name: 'can_confirm_on_hit', options: ['default' => false])]
    private bool $canConfirmOnHit = false;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $note = null;

    /** @var Collection<int, BlockstringGap> */
    #[ORM\OneToMany(targetEntity: BlockstringGap::class, mappedBy: 'step', cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $gaps;

    public function __construct()
    {
        $this->gaps = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }
    public function getSequence(): ?BlockstringSequence { return $this->sequence; }
    public function setSequence(?BlockstringSequence $sequence): self { $this->sequence = $sequence; return $this; }
    public function getRoute(): ?BlockstringRoute { return $this->route; }
    public function setRoute(?BlockstringRoute $route): self { $this->route = $route; return $this; }
    public function getMove(): ?Move { return $this->move; }
    public function setMove(?Move $move): self { $this->move = $move; return $this; }
    public function getOrdinal(): int { return $this->ordinal; }
    public function setOrdinal(int $ordinal): self { $this->ordinal = $ordinal; return $this; }
    public function canConfirmOnHit(): bool { return $this->canConfirmOnHit; }
    public function setCanConfirmOnHit(bool $canConfirmOnHit): self { $this->canConfirmOnHit = $canConfirmOnHit; return $this; }
    public function getNote(): ?string { return $this->note; }
    public function setNote(?string $note): self { $this->note = $note; return $this; }
    /** @return Collection<int, BlockstringGap> */ public function getGaps(): Collection { return $this->gaps; }
    public function addGap(BlockstringGap $gap): self { if (!$this->gaps->contains($gap)) { $this->gaps->add($gap); $gap->setStep($this); } return $this; }
}
