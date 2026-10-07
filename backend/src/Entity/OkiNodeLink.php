<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\OkiNodeLinkRepository;
use Doctrine\ORM\Mapping as ORM;

/** A step between two oki nodes; a null fromNode is a step taken straight from the profile's ender. */
#[ORM\Entity(repositoryClass: OkiNodeLinkRepository::class)]
#[ORM\Table(name: 'oki_node_link', schema: 'sf6')]
#[ORM\Index(name: 'idx_oki_node_link_from', columns: ['from_node_id'])]
#[ORM\Index(name: 'idx_oki_node_link_to', columns: ['to_node_id'])]
class OkiNodeLink
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'outgoingLinks')]
    #[ORM\JoinColumn(name: 'from_node_id', referencedColumnName: 'id', nullable: true, onDelete: 'CASCADE')]
    private ?OkiNode $fromNode = null;

    #[ORM\ManyToOne(inversedBy: 'incomingLinks')]
    #[ORM\JoinColumn(name: 'to_node_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private OkiNode $toNode;

    #[ORM\Column(name: 'step_type', length: 32)]
    private string $stepType = 'IMMEDIATE';

    #[ORM\Column(length: 16, options: ['default' => 'normal'])]
    private string $kind = 'normal';

    #[ORM\Column(name: 'read_label', length: 48, nullable: true)]
    private ?string $readLabel = null;

    #[ORM\Column(name: 'safe_jump', options: ['default' => false])]
    private bool $safeJump = false;

    #[ORM\Column(length: 16, nullable: true)]
    private ?string $recovery = null;

    public function getId(): ?int { return $this->id; }
    public function getFromNode(): ?OkiNode { return $this->fromNode; }
    public function setFromNode(?OkiNode $fromNode): self { $this->fromNode = $fromNode; return $this; }
    public function getToNode(): OkiNode { return $this->toNode; }
    public function setToNode(OkiNode $toNode): self { $this->toNode = $toNode; return $this; }
    public function getStepType(): string { return $this->stepType; }
    public function setStepType(string $stepType): self { $this->stepType = $stepType; return $this; }
    public function getKind(): string { return $this->kind; }
    public function setKind(string $kind): self { $this->kind = $kind; return $this; }
    public function getReadLabel(): ?string { return $this->readLabel; }
    public function setReadLabel(?string $readLabel): self { $this->readLabel = $readLabel; return $this; }
    public function isSafeJump(): bool { return $this->safeJump; }
    public function setSafeJump(bool $safeJump): self { $this->safeJump = $safeJump; return $this; }
    public function getRecovery(): ?string { return $this->recovery; }
    public function setRecovery(?string $recovery): self { $this->recovery = $recovery; return $this; }
}
