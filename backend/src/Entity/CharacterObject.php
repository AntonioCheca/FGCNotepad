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

    #[ORM\ManyToOne(targetEntity: Character::class)]
    #[ORM\JoinColumn(name: 'character_id', referencedColumnName: 'id', nullable: true, onDelete: 'CASCADE')]
    private ?Character $character = null;

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

    public const KIND_STOCK = 'stock';
    public const KIND_SCALER = 'scaler';
    public const KIND_STATE = 'state';
    public const KINDS = [self::KIND_STOCK, self::KIND_SCALER, self::KIND_STATE];
    public const SPEND_CONSUMED = 'consumed';
    public const SPEND_MAINTAINED = 'maintained';
    public const SOURCE_NAMED = 'named';
    public const SOURCE_INSTALL = 'install';

    #[ORM\Column(type: Types::STRING, length: 16, options: ['default' => 'stock'])]
    private string $kind = self::KIND_STOCK;

    #[ORM\Column(name: 'spend_behavior', type: Types::STRING, length: 16, options: ['default' => 'consumed'])]
    private string $spendBehavior = self::SPEND_CONSUMED;

    #[ORM\Column(name: 'starts_with', type: Types::INTEGER, options: ['default' => 0])]
    private int $startsWith = 0;

    #[ORM\Column(name: 'resets_each_round', type: Types::BOOLEAN, options: ['default' => false])]
    private bool $resetsEachRound = false;

    #[ORM\Column(name: 'min_status', type: Types::INTEGER, options: ['default' => 0])]
    private int $minStatus = 0;

    #[ORM\Column(name: 'extractor_key', type: Types::TEXT, nullable: true)]
    private ?string $extractorKey = null;

    #[ORM\Column(name: 'extractor_source', type: Types::STRING, length: 16, options: ['default' => 'named'])]
    private string $extractorSource = self::SOURCE_NAMED;

    #[ORM\Column(name: 'sort_order', type: Types::INTEGER, options: ['default' => 0])]
    private int $sortOrder = 0;

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

    public function getCharacter(): ?Character
    {
        return $this->character;
    }

    public function setCharacter(?Character $character): static
    {
        $this->character = $character;
        if (null !== $character) {
            $this->characterName = $character->getName();
        }

        return $this;
    }

    public function getKind(): string
    {
        return $this->kind;
    }

    public function setKind(string $kind): static
    {
        $this->kind = $kind;

        return $this;
    }

    public function getSpendBehavior(): string
    {
        return $this->spendBehavior;
    }

    public function setSpendBehavior(string $spendBehavior): static
    {
        $this->spendBehavior = $spendBehavior;

        return $this;
    }

    public function getStartsWith(): int
    {
        return $this->startsWith;
    }

    public function setStartsWith(int $startsWith): static
    {
        $this->startsWith = $startsWith;

        return $this;
    }

    public function resetsEachRound(): bool
    {
        return $this->resetsEachRound;
    }

    public function setResetsEachRound(bool $resetsEachRound): static
    {
        $this->resetsEachRound = $resetsEachRound;

        return $this;
    }

    public function getMinStatus(): int
    {
        return $this->minStatus;
    }

    public function setMinStatus(int $minStatus): static
    {
        $this->minStatus = $minStatus;

        return $this;
    }

    public function getExtractorKey(): ?string
    {
        return $this->extractorKey;
    }

    public function setExtractorKey(?string $extractorKey): static
    {
        $this->extractorKey = $extractorKey;

        return $this;
    }

    public function getExtractorSource(): string
    {
        return $this->extractorSource;
    }

    public function setExtractorSource(string $extractorSource): static
    {
        $this->extractorSource = $extractorSource;

        return $this;
    }

    public function getSortOrder(): int
    {
        return $this->sortOrder;
    }

    public function setSortOrder(int $sortOrder): static
    {
        $this->sortOrder = $sortOrder;

        return $this;
    }
}
