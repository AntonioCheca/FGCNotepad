<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\OkiNodeRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/** An attacker option in an oki graph: either a character move or a universal action, never both. */
#[ORM\Entity(repositoryClass: OkiNodeRepository::class)]
#[ORM\Table(name: 'oki_node', schema: 'sf6')]
#[ORM\Index(name: 'idx_oki_node_setup', columns: ['oki_setup_id'])]
#[ORM\Index(name: 'idx_oki_node_move', columns: ['move_id'])]
class OkiNode
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'nodes')]
    #[ORM\JoinColumn(name: 'oki_setup_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private OkiSetup $setup;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'move_id', referencedColumnName: 'id', nullable: true, onDelete: 'RESTRICT')]
    private ?Move $move = null;

    #[ORM\Column(length: 24, nullable: true)]
    private ?string $action = null;

    #[ORM\Column(name: 'sort_order', type: Types::SMALLINT, options: ['default' => 0])]
    private int $sortOrder = 0;

    #[ORM\Column(name: 'hit_level', length: 16, nullable: true)]
    private ?string $hitLevel = null;

    #[ORM\Column(name: 'side_switch', options: ['default' => false])]
    private bool $sideSwitch = false;

    /** @var Collection<int, OkiNodeLink> */
    #[ORM\OneToMany(targetEntity: OkiNodeLink::class, mappedBy: 'fromNode', cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $outgoingLinks;

    /** @var Collection<int, OkiNodeLink> */
    #[ORM\OneToMany(targetEntity: OkiNodeLink::class, mappedBy: 'toNode', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['id' => 'ASC'])]
    private Collection $incomingLinks;

    public function __construct()
    {
        $this->outgoingLinks = new ArrayCollection();
        $this->incomingLinks = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }
    public function getSetup(): OkiSetup { return $this->setup; }
    public function setSetup(OkiSetup $setup): self { $this->setup = $setup; return $this; }
    public function getMove(): ?Move { return $this->move; }
    public function setMove(?Move $move): self { $this->move = $move; return $this; }
    public function getAction(): ?string { return $this->action; }
    public function setAction(?string $action): self { $this->action = $action; return $this; }
    public function getSortOrder(): int { return $this->sortOrder; }
    public function setSortOrder(int $sortOrder): self { $this->sortOrder = $sortOrder; return $this; }
    public function getHitLevel(): ?string { return $this->hitLevel; }
    public function setHitLevel(?string $hitLevel): self { $this->hitLevel = $hitLevel; return $this; }
    public function isSideSwitch(): bool { return $this->sideSwitch; }
    public function setSideSwitch(bool $sideSwitch): self { $this->sideSwitch = $sideSwitch; return $this; }
    /** @return Collection<int, OkiNodeLink> */
    public function getOutgoingLinks(): Collection { return $this->outgoingLinks; }
    /** @return Collection<int, OkiNodeLink> */
    public function getIncomingLinks(): Collection { return $this->incomingLinks; }
    public function addIncomingLink(OkiNodeLink $link): self { if (!$this->incomingLinks->contains($link)) { $this->incomingLinks->add($link); $link->setToNode($this); } return $this; }
}
