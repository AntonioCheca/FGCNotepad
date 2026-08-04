<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'blockstring_route', schema: 'sf6')]
#[ORM\Index(name: 'idx_blockstring_route_sequence', columns: ['sequence_id', 'display_order'])]
#[ORM\Index(name: 'idx_blockstring_route_branch_step', columns: ['branch_anchor_step_id'])]
#[ORM\Index(name: 'idx_blockstring_route_branch_connection', columns: ['branch_anchor_connection_id'])]
class BlockstringRoute
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'routes')]
    #[ORM\JoinColumn(name: 'sequence_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?BlockstringSequence $sequence = null;

    #[ORM\Column(type: Types::TEXT)]
    private string $name = 'Main route';

    #[ORM\Column(name: 'display_order', type: Types::SMALLINT, options: ['default' => 1])]
    private int $displayOrder = 1;

    #[ORM\Column(name: 'is_main', options: ['default' => false])]
    private bool $main = false;

    #[ORM\Column(name: 'tactical_reason_text', type: Types::TEXT, nullable: true)]
    private ?string $tacticalReasonText = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'branch_anchor_step_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?BlockstringSequenceStep $branchAnchorStep = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'branch_anchor_connection_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?BlockstringRouteConnection $branchAnchorConnection = null;

    /** @var Collection<int, BlockstringSequenceStep> */
    #[ORM\OneToMany(targetEntity: BlockstringSequenceStep::class, mappedBy: 'route', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['ordinal' => 'ASC', 'id' => 'ASC'])]
    private Collection $steps;

    /** @var Collection<int, BlockstringRouteConnection> */
    #[ORM\OneToMany(targetEntity: BlockstringRouteConnection::class, mappedBy: 'route', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['ordinal' => 'ASC', 'id' => 'ASC'])]
    private Collection $connections;

    public function __construct()
    {
        $this->steps = new ArrayCollection();
        $this->connections = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }
    public function getSequence(): ?BlockstringSequence { return $this->sequence; }
    public function setSequence(?BlockstringSequence $sequence): self { $this->sequence = $sequence; return $this; }
    public function getName(): string { return $this->name; }
    public function setName(string $name): self { $this->name = $name; return $this; }
    public function getDisplayOrder(): int { return $this->displayOrder; }
    public function setDisplayOrder(int $displayOrder): self { $this->displayOrder = $displayOrder; return $this; }
    public function isMain(): bool { return $this->main; }
    public function setMain(bool $main): self { $this->main = $main; return $this; }
    public function getTacticalReasonText(): ?string { return $this->tacticalReasonText; }
    public function setTacticalReasonText(?string $tacticalReasonText): self { $this->tacticalReasonText = $tacticalReasonText; return $this; }
    public function getBranchAnchorStep(): ?BlockstringSequenceStep { return $this->branchAnchorStep; }
    public function setBranchAnchorStep(?BlockstringSequenceStep $branchAnchorStep): self { $this->branchAnchorStep = $branchAnchorStep; return $this; }
    public function getBranchAnchorConnection(): ?BlockstringRouteConnection { return $this->branchAnchorConnection; }
    public function setBranchAnchorConnection(?BlockstringRouteConnection $branchAnchorConnection): self { $this->branchAnchorConnection = $branchAnchorConnection; return $this; }
    /** @return Collection<int, BlockstringSequenceStep> */ public function getSteps(): Collection { return $this->steps; }
    public function addStep(BlockstringSequenceStep $step): self { if (!$this->steps->contains($step)) { $this->steps->add($step); $step->setRoute($this); } return $this; }
    /** @return Collection<int, BlockstringRouteConnection> */ public function getConnections(): Collection { return $this->connections; }
    public function addConnection(BlockstringRouteConnection $connection): self { if (!$this->connections->contains($connection)) { $this->connections->add($connection); $connection->setRoute($this); } return $this; }
}
