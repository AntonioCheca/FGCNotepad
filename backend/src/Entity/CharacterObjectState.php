<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\CharacterObjectStateRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CharacterObjectStateRepository::class)]
#[ORM\Table(name: 'character_object_state', schema: 'sf6')]
#[ORM\Index(name: 'idx_character_object_state_object_required', columns: ['object_name', 'status_required'])]
#[ORM\Index(name: 'idx_character_object_state_object_added_relative', columns: ['object_name', 'added_relative'])]
#[ORM\Index(name: 'idx_character_object_state_object_added_absolute', columns: ['object_name', 'added_absolute'])]
class CharacterObjectState
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'character_object_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?CharacterObject $characterObject = null;

    #[ORM\Column(name: 'character_name', type: Types::TEXT, nullable: true)]
    private ?string $characterName = null;

    #[ORM\Column(name: 'object_key', type: Types::TEXT, nullable: true)]
    private ?string $objectKey = null;

    #[ORM\Column(name: 'object_name', type: Types::TEXT)]
    private ?string $objectName = null;

    #[ORM\Column(name: 'status_required', type: Types::TEXT, nullable: true)]
    private ?string $statusRequired = null;

    #[ORM\Column(type: Types::BOOLEAN, options: ['default' => false])]
    private bool $consumed = false;

    #[ORM\Column(name: 'added_relative', type: Types::TEXT, nullable: true)]
    private ?string $addedRelative = null;

    #[ORM\Column(name: 'added_absolute', type: Types::TEXT, nullable: true)]
    private ?string $addedAbsolute = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCharacterObject(): ?CharacterObject
    {
        return $this->characterObject;
    }

    public function setCharacterObject(?CharacterObject $characterObject): static
    {
        $this->characterObject = $characterObject;
        if ($characterObject instanceof CharacterObject) {
            $this->characterName = $characterObject->getCharacterName();
            $this->objectKey = $characterObject->getObjectKey();
            $this->objectName = $characterObject->getName();
        }

        return $this;
    }

    public function getCharacterName(): ?string
    {
        return $this->characterName ?? $this->characterObject?->getCharacterName();
    }

    public function setCharacterName(?string $characterName): static
    {
        $this->characterName = $characterName;

        return $this;
    }

    public function getObjectName(): ?string
    {
        return $this->objectName ?? $this->characterObject?->getName();
    }

    public function setObjectName(string $objectName): static
    {
        $this->objectName = $objectName;

        return $this;
    }

    public function getObjectKey(): ?string
    {
        return $this->objectKey ?? $this->characterObject?->getObjectKey();
    }

    public function setObjectKey(?string $objectKey): static
    {
        $this->objectKey = $objectKey;

        return $this;
    }

    public function getStatusRequired(): ?string
    {
        return $this->statusRequired;
    }

    public function setStatusRequired(?string $statusRequired): static
    {
        $this->statusRequired = $statusRequired;

        return $this;
    }

    public function isConsumed(): bool
    {
        return $this->consumed;
    }

    public function setConsumed(bool $consumed): static
    {
        $this->consumed = $consumed;

        return $this;
    }

    public function getAddedRelative(): ?string
    {
        return $this->addedRelative;
    }

    public function setAddedRelative(?string $addedRelative): static
    {
        $this->addedRelative = $addedRelative;

        return $this;
    }

    public function getAddedAbsolute(): ?string
    {
        return $this->addedAbsolute;
    }

    public function setAddedAbsolute(?string $addedAbsolute): static
    {
        $this->addedAbsolute = $addedAbsolute;

        return $this;
    }
}
