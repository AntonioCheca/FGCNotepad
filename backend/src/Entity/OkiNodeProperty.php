<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\OkiNodePropertyRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: OkiNodePropertyRepository::class)]
#[ORM\Table(name: 'oki_node_property', schema: 'sf6')]
#[ORM\Index(name: 'idx_oki_node_property_node', columns: ['oki_node_id'])]
#[ORM\Index(name: 'idx_oki_node_property_property', columns: ['property'])]
class OkiNodeProperty
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'properties')]
    #[ORM\JoinColumn(name: 'oki_node_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private OkiNode $node;

    #[ORM\Column(length: 48)]
    private string $property;

    public function getId(): ?int { return $this->id; }
    public function getNode(): OkiNode { return $this->node; }
    public function setNode(OkiNode $node): self { $this->node = $node; return $this; }
    public function getProperty(): string { return $this->property; }
    public function setProperty(string $property): self { $this->property = $property; return $this; }
}
