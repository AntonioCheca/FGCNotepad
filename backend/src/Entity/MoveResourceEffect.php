<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\MoveResourceEffectRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/** What one move does to one character resource (+N gain, -N spend, or set to N). */
#[ORM\Entity(repositoryClass: MoveResourceEffectRepository::class)]
#[ORM\Table(name: 'move_resource_effect', schema: 'sf6')]
#[ORM\UniqueConstraint(name: 'uniq_move_resource_effect', columns: ['move_id', 'character_object_id'])]
class MoveResourceEffect
{
    public const MODE_RELATIVE = 'relative';
    public const MODE_SET = 'set';
    public const SOURCE_MANUAL = 'manual';
    public const SOURCE_INFERRED = 'inferred';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'move_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Move $move;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'character_object_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private CharacterObject $characterObject;

    #[ORM\Column(type: Types::STRING, length: 16, options: ['default' => 'relative'])]
    private string $mode = self::MODE_RELATIVE;

    #[ORM\Column(type: Types::INTEGER)]
    private int $amount = 0;

    #[ORM\Column(type: Types::STRING, length: 16, options: ['default' => 'manual'])]
    private string $source = self::SOURCE_MANUAL;

    #[ORM\Column(name: 'observation_count', type: Types::INTEGER, options: ['default' => 0])]
    private int $observationCount = 0;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'edited_by_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?User $editedBy = null;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $updatedAt;

    public function __construct()
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getMove(): Move
    {
        return $this->move;
    }

    public function setMove(Move $move): static
    {
        $this->move = $move;

        return $this;
    }

    public function getCharacterObject(): CharacterObject
    {
        return $this->characterObject;
    }

    public function setCharacterObject(CharacterObject $characterObject): static
    {
        $this->characterObject = $characterObject;

        return $this;
    }

    public function getMode(): string
    {
        return $this->mode;
    }

    public function setMode(string $mode): static
    {
        $this->mode = $mode;

        return $this;
    }

    public function getAmount(): int
    {
        return $this->amount;
    }

    public function setAmount(int $amount): static
    {
        $this->amount = $amount;

        return $this;
    }

    public function getSource(): string
    {
        return $this->source;
    }

    public function setSource(string $source): static
    {
        $this->source = $source;

        return $this;
    }

    public function getObservationCount(): int
    {
        return $this->observationCount;
    }

    public function setObservationCount(int $observationCount): static
    {
        $this->observationCount = $observationCount;

        return $this;
    }

    public function getEditedBy(): ?User
    {
        return $this->editedBy;
    }

    public function setEditedBy(?User $editedBy): static
    {
        $this->editedBy = $editedBy;
        $this->updatedAt = new \DateTimeImmutable();

        return $this;
    }
}
