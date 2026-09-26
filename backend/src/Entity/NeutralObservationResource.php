<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * A character-specific resource value read at a neutral observation's action start. source_key is the extractor
 * resource name; character_object is the FGCNotepad resource it matched at import time, when there was one.
 */
#[ORM\Entity]
#[ORM\Table(name: 'neutral_observation_resource', schema: 'sf6')]
#[ORM\UniqueConstraint(name: 'uniq_neutral_observation_resource_side_key', columns: ['observation_id', 'side', 'source_key'])]
#[ORM\Index(name: 'idx_neutral_observation_resource_key_value', columns: ['source_key', 'side', 'value'])]
#[ORM\Index(name: 'idx_neutral_observation_resource_object', columns: ['character_object_id'])]
class NeutralObservationResource
{
    public const SIDE_ACTOR = 'actor';
    public const SIDE_OPPONENT = 'opponent';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'observation_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private NeutralObservation $observation;

    #[ORM\Column(type: Types::STRING, length: 16)]
    private string $side = self::SIDE_ACTOR;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'character_object_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?CharacterObject $characterObject = null;

    #[ORM\Column(name: 'source_key', type: Types::STRING, length: 64)]
    private string $sourceKey = '';

    #[ORM\Column(type: Types::INTEGER)]
    private int $value = 0;

    public function getId(): ?int { return $this->id; }
    public function getObservation(): NeutralObservation { return $this->observation; }
    public function getSide(): string { return $this->side; }
    public function getCharacterObject(): ?CharacterObject { return $this->characterObject; }
    public function getSourceKey(): string { return $this->sourceKey; }
    public function getValue(): int { return $this->value; }
}
