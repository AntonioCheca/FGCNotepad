<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'blockstring_adaptation_step', schema: 'sf6')]
#[ORM\Index(name: 'idx_blockstring_adaptation_step_adaptation', columns: ['adaptation_id', 'ordinal'])]
#[ORM\Index(name: 'idx_blockstring_adaptation_step_move', columns: ['move_id'])]
class BlockstringAdaptationStep
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'steps')]
    #[ORM\JoinColumn(name: 'adaptation_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?BlockstringAdaptation $adaptation = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'move_id', referencedColumnName: 'id', nullable: false)]
    private ?Move $move = null;

    #[ORM\Column]
    private int $ordinal = 1;

    public function getId(): ?int { return $this->id; }
    public function getAdaptation(): ?BlockstringAdaptation { return $this->adaptation; }
    public function setAdaptation(?BlockstringAdaptation $adaptation): self { $this->adaptation = $adaptation; return $this; }
    public function getMove(): ?Move { return $this->move; }
    public function setMove(?Move $move): self { $this->move = $move; return $this; }
    public function getOrdinal(): int { return $this->ordinal; }
    public function setOrdinal(int $ordinal): self { $this->ordinal = $ordinal; return $this; }
}
