<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\OkiNodeLinkRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

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
    #[ORM\JoinColumn(name: 'from_node_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private OkiNode $fromNode;

    #[ORM\ManyToOne(inversedBy: 'incomingLinks')]
    #[ORM\JoinColumn(name: 'to_node_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private OkiNode $toNode;

    #[ORM\Column(name: 'step_type', length: 32)]
    private string $stepType = 'IMMEDIATE';

    #[ORM\Column(name: 'min_frames', type: Types::SMALLINT, nullable: true)]
    private ?int $minFrames = null;

    #[ORM\Column(name: 'max_frames', type: Types::SMALLINT, nullable: true)]
    private ?int $maxFrames = null;

    #[ORM\Column(length: 16, options: ['default' => 'normal'])]
    private string $kind = 'normal';

    #[ORM\Column(name: 'read_label', length: 48, nullable: true)]
    private ?string $readLabel = null;

    #[ORM\Column(type: Types::SMALLINT, options: ['default' => 1])]
    private int $layer = 1;

    public function getId(): ?int { return $this->id; }
    public function getFromNode(): OkiNode { return $this->fromNode; }
    public function setFromNode(OkiNode $fromNode): self { $this->fromNode = $fromNode; return $this; }
    public function getToNode(): OkiNode { return $this->toNode; }
    public function setToNode(OkiNode $toNode): self { $this->toNode = $toNode; return $this; }
    public function getStepType(): string { return $this->stepType; }
    public function setStepType(string $stepType): self { $this->stepType = $stepType; return $this; }
    public function getMinFrames(): ?int { return $this->minFrames; }
    public function setMinFrames(?int $minFrames): self { $this->minFrames = $minFrames; return $this; }
    public function getMaxFrames(): ?int { return $this->maxFrames; }
    public function setMaxFrames(?int $maxFrames): self { $this->maxFrames = $maxFrames; return $this; }
    public function getKind(): string { return $this->kind; }
    public function setKind(string $kind): self { $this->kind = $kind; return $this; }
    public function getReadLabel(): ?string { return $this->readLabel; }
    public function setReadLabel(?string $readLabel): self { $this->readLabel = $readLabel; return $this; }
    public function getLayer(): int { return $this->layer; }
    public function setLayer(int $layer): self { $this->layer = $layer; return $this; }
}
