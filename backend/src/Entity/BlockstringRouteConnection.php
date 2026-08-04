<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'blockstring_route_connection', schema: 'sf6')]
#[ORM\Index(name: 'idx_blockstring_route_connection_route', columns: ['route_id', 'ordinal'])]
#[ORM\Index(name: 'idx_blockstring_route_connection_source', columns: ['source_step_id'])]
#[ORM\Index(name: 'idx_blockstring_route_connection_destination', columns: ['destination_step_id'])]
#[ORM\Index(name: 'idx_blockstring_route_connection_gap', columns: ['gap_id'])]
class BlockstringRouteConnection
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'connections')]
    #[ORM\JoinColumn(name: 'route_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?BlockstringRoute $route = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'source_step_id', referencedColumnName: 'id', nullable: true, onDelete: 'CASCADE')]
    private ?BlockstringSequenceStep $sourceStep = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'destination_step_id', referencedColumnName: 'id', nullable: true, onDelete: 'CASCADE')]
    private ?BlockstringSequenceStep $destinationStep = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'gap_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?BlockstringGap $gap = null;

    #[ORM\Column]
    private int $ordinal = 1;

    #[ORM\Column(type: Types::STRING, length: 40)]
    private string $type = 'guaranteed';

    public function getId(): ?int { return $this->id; }
    public function getRoute(): ?BlockstringRoute { return $this->route; }
    public function setRoute(?BlockstringRoute $route): self { $this->route = $route; return $this; }
    public function getSourceStep(): ?BlockstringSequenceStep { return $this->sourceStep; }
    public function setSourceStep(?BlockstringSequenceStep $sourceStep): self { $this->sourceStep = $sourceStep; return $this; }
    public function getDestinationStep(): ?BlockstringSequenceStep { return $this->destinationStep; }
    public function setDestinationStep(?BlockstringSequenceStep $destinationStep): self { $this->destinationStep = $destinationStep; return $this; }
    public function getGap(): ?BlockstringGap { return $this->gap; }
    public function setGap(?BlockstringGap $gap): self { $this->gap = $gap; return $this; }
    public function getOrdinal(): int { return $this->ordinal; }
    public function setOrdinal(int $ordinal): self { $this->ordinal = $ordinal; return $this; }
    public function getType(): string { return $this->type; }
    public function setType(string $type): self { $this->type = $type; return $this; }
}
