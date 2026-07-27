<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\CharacterObjectRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CharacterObjectRepository::class)]
#[ORM\Table(name: 'character_object', schema: 'sf6')]
#[ORM\UniqueConstraint(name: 'uniq_character_object_key', columns: ['object_key'])]
#[ORM\Index(name: 'idx_character_object_character_name', columns: ['character_name'])]
class CharacterObject
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'character_name', type: Types::TEXT)]
    private ?string $characterName = null;

    #[ORM\Column(name: 'object_key', type: Types::TEXT)]
    private ?string $objectKey = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $name = null;

    #[ORM\Column(name: 'status_type', type: Types::STRING, length: 16)]
    private string $statusType = 'boolean';

    #[ORM\Column(name: 'max_status', type: Types::INTEGER, nullable: true)]
    private ?int $maxStatus = null;

    #[ORM\Column(name: 'can_be_consumed', type: Types::BOOLEAN, options: ['default' => false])]
    private bool $canBeConsumed = false;

    #[ORM\Column(name: 'can_be_added_relative', type: Types::BOOLEAN, options: ['default' => false])]
    private bool $canBeAddedRelative = false;

    #[ORM\Column(name: 'can_be_added_absolute', type: Types::BOOLEAN, options: ['default' => false])]
    private bool $canBeAddedAbsolute = false;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCharacterName(): ?string
    {
        return $this->characterName;
    }

    public function setCharacterName(string $characterName): static
    {
        $this->characterName = $characterName;

        return $this;
    }

    public function getObjectKey(): ?string
    {
        return $this->objectKey;
    }

    public function setObjectKey(string $objectKey): static
    {
        $this->objectKey = $objectKey;

        return $this;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getStatusType(): string
    {
        return $this->statusType;
    }

    public function setStatusType(string $statusType): static
    {
        $this->statusType = $statusType;

        return $this;
    }

    public function getMaxStatus(): ?int
    {
        return $this->maxStatus;
    }

    public function setMaxStatus(?int $maxStatus): static
    {
        $this->maxStatus = $maxStatus;

        return $this;
    }

    public function canBeConsumed(): bool
    {
        return $this->canBeConsumed;
    }

    public function setCanBeConsumed(bool $canBeConsumed): static
    {
        $this->canBeConsumed = $canBeConsumed;

        return $this;
    }

    public function canBeAddedRelative(): bool
    {
        return $this->canBeAddedRelative;
    }

    public function setCanBeAddedRelative(bool $canBeAddedRelative): static
    {
        $this->canBeAddedRelative = $canBeAddedRelative;

        return $this;
    }

    public function canBeAddedAbsolute(): bool
    {
        return $this->canBeAddedAbsolute;
    }

    public function setCanBeAddedAbsolute(bool $canBeAddedAbsolute): static
    {
        $this->canBeAddedAbsolute = $canBeAddedAbsolute;

        return $this;
    }
}
