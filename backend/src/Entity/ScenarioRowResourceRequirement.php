<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Table(name: 'scenario_row_resource_requirement', schema: 'sf6')]
#[ORM\Entity]
class ScenarioRowResourceRequirement
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'resourceRequirements')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?ScenarioRow $row = null;

    #[ORM\Column(type: Types::INTEGER)]
    private int $position = 0;

    #[ORM\Column(name: 'resource_owner', type: Types::STRING, length: 16)]
    private string $resourceOwner = 'attacker';

    #[ORM\Column(name: 'resource_type', type: Types::STRING, length: 16)]
    private string $resourceType = 'drive';

    #[ORM\Column(type: Types::STRING, length: 8)]
    private string $operator = '>=';

    #[ORM\Column(name: 'threshold_value', type: Types::FLOAT)]
    private float $thresholdValue = 0.0;

    public function getRow(): ?ScenarioRow
    {
        return $this->row;
    }

    public function setRow(?ScenarioRow $row): static
    {
        $this->row = $row;

        return $this;
    }

    public function getPosition(): int
    {
        return $this->position;
    }

    public function setPosition(int $position): static
    {
        $this->position = $position;

        return $this;
    }

    public function getResourceOwner(): string
    {
        return $this->resourceOwner;
    }

    public function setResourceOwner(string $resourceOwner): static
    {
        $this->resourceOwner = $resourceOwner;

        return $this;
    }

    public function getResourceType(): string
    {
        return $this->resourceType;
    }

    public function setResourceType(string $resourceType): static
    {
        $this->resourceType = $resourceType;

        return $this;
    }

    public function getOperator(): string
    {
        return $this->operator;
    }

    public function setOperator(string $operator): static
    {
        $this->operator = $operator;

        return $this;
    }

    public function getThresholdValue(): float
    {
        return $this->thresholdValue;
    }

    public function setThresholdValue(float $thresholdValue): static
    {
        $this->thresholdValue = $thresholdValue;

        return $this;
    }
}
