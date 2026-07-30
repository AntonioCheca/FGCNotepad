<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\OkiNodeRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: OkiNodeRepository::class)]
#[ORM\Table(name: 'oki_node', schema: 'sf6')]
#[ORM\Index(name: 'idx_oki_node_setup', columns: ['oki_setup_id'])]
#[ORM\Index(name: 'idx_oki_node_move', columns: ['move_id'])]
#[ORM\Index(name: 'idx_oki_node_option_type', columns: ['option_type'])]
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
    #[ORM\JoinColumn(name: 'move_id', referencedColumnName: 'id', nullable: false, onDelete: 'RESTRICT')]
    private Move $move;

    #[ORM\Column(name: 'sort_order', type: Types::SMALLINT, options: ['default' => 0])]
    private int $sortOrder = 0;

    #[ORM\Column(name: 'is_default_route', options: ['default' => false])]
    private bool $defaultRoute = false;

    #[ORM\Column(name: 'route_explanation', type: Types::TEXT, nullable: true)]
    private ?string $routeExplanation = null;

    #[ORM\Column(name: 'option_type', length: 40, nullable: true)]
    private ?string $optionType = null;

    /** @var Collection<int, OkiNodeProperty> */
    #[ORM\OneToMany(targetEntity: OkiNodeProperty::class, mappedBy: 'node', cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $properties;

    /** @var Collection<int, OkiOptionInteraction> */
    #[ORM\OneToMany(targetEntity: OkiOptionInteraction::class, mappedBy: 'node', cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $interactions;

    /** @var Collection<int, OkiNodeLink> */
    #[ORM\OneToMany(targetEntity: OkiNodeLink::class, mappedBy: 'fromNode', cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $outgoingLinks;

    /** @var Collection<int, OkiNodeLink> */
    #[ORM\OneToMany(targetEntity: OkiNodeLink::class, mappedBy: 'toNode', cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $incomingLinks;

    public function __construct()
    {
        $this->properties = new ArrayCollection();
        $this->interactions = new ArrayCollection();
        $this->outgoingLinks = new ArrayCollection();
        $this->incomingLinks = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }
    public function getSetup(): OkiSetup { return $this->setup; }
    public function setSetup(OkiSetup $setup): self { $this->setup = $setup; return $this; }
    public function getMove(): Move { return $this->move; }
    public function setMove(Move $move): self { $this->move = $move; return $this; }
    public function getSortOrder(): int { return $this->sortOrder; }
    public function setSortOrder(int $sortOrder): self { $this->sortOrder = $sortOrder; return $this; }
    public function isDefaultRoute(): bool { return $this->defaultRoute; }
    public function setDefaultRoute(bool $defaultRoute): self { $this->defaultRoute = $defaultRoute; return $this; }
    public function getRouteExplanation(): ?string { return $this->routeExplanation; }
    public function setRouteExplanation(?string $routeExplanation): self { $this->routeExplanation = $routeExplanation; return $this; }
    public function getOptionType(): ?string { return $this->optionType; }
    public function setOptionType(?string $optionType): self { $this->optionType = $optionType; return $this; }
    /** @return Collection<int, OkiNodeProperty> */
    public function getProperties(): Collection { return $this->properties; }
    /** @return Collection<int, OkiOptionInteraction> */
    public function getInteractions(): Collection { return $this->interactions; }
    /** @return Collection<int, OkiNodeLink> */
    public function getOutgoingLinks(): Collection { return $this->outgoingLinks; }
    /** @return Collection<int, OkiNodeLink> */
    public function getIncomingLinks(): Collection { return $this->incomingLinks; }
    public function addProperty(OkiNodeProperty $property): self { if (!$this->properties->contains($property)) { $this->properties->add($property); $property->setNode($this); } return $this; }
    public function addInteraction(OkiOptionInteraction $interaction): self { if (!$this->interactions->contains($interaction)) { $this->interactions->add($interaction); $interaction->setNode($this); } return $this; }
    public function addOutgoingLink(OkiNodeLink $link): self { if (!$this->outgoingLinks->contains($link)) { $this->outgoingLinks->add($link); $link->setFromNode($this); } return $this; }
}
