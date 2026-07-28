<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\ComboRequirementRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ComboRequirementRepository::class)]
#[ORM\Table(name: "combo_requirement", schema: "sf6")]
#[ORM\Index(name: "idx_combo_requirement_counter_hit", columns: ["counter_hit_required"])]
#[ORM\Index(name: "idx_combo_requirement_punish_counter", columns: ["punish_counter_required"])]
#[ORM\Index(name: "idx_combo_requirement_corner", columns: ["corner_required"])]
#[ORM\Index(name: "idx_combo_requirement_airborne", columns: ["airborne_required"])]
#[ORM\Index(name: "idx_combo_requirement_not_crouching", columns: ["not_crouching_required"])]
#[ORM\Index(name: "idx_combo_requirement_side_switches", columns: ["side_switches_required"])]
class ComboRequirement
{
    public const POSTURE_STANDING = 'standing';
    public const POSTURE_CROUCHING = 'crouching';
    public const GROUND_STATE_GROUNDED = 'grounded';
    public const GROUND_STATE_AIRBORNE = 'airborne';
    public const JUGGLE_ALTITUDE_LOW = 'low';
    public const JUGGLE_ALTITUDE_MEDIUM = 'medium';
    public const JUGGLE_ALTITUDE_HIGH = 'high';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToOne(inversedBy: 'comboRequirement', cascade: ['persist', 'remove'])]
    #[ORM\JoinColumn(nullable: false)]
    private ?ComboSequences $sequence = null;

    #[ORM\Column]
    private ?bool $counter_hit_required = null;

    #[ORM\Column]
    private ?bool $punish_counter_required = null;

    #[ORM\Column]
    private ?bool $corner_required = null;

    #[ORM\Column]
    private ?bool $airborne_required = null;

    #[ORM\Column]
    private ?bool $not_crouching_required = null;

    #[ORM\Column(options: ['default' => false])]
    private bool $side_switches_required = false;

    #[ORM\Column(name: 'initial_opponent_posture', length: 16, nullable: true)]
    private ?string $initialOpponentPosture = null;

    #[ORM\Column(name: 'initial_opponent_ground_state', length: 16, nullable: true)]
    private ?string $initialOpponentGroundState = null;

    #[ORM\Column(name: 'initial_juggle_altitude', length: 16, nullable: true)]
    private ?string $initialJuggleAltitude = null;

    /**
     * @var Collection<int, CharacterObjectState>
     */
    #[ORM\ManyToMany(targetEntity: CharacterObjectState::class, cascade: ['persist', 'remove'])]
    #[ORM\JoinTable(
        name: 'sf6.combo_requirement_object_state',
        joinColumns: [new ORM\JoinColumn(name: 'combo_requirement_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')],
        inverseJoinColumns: [new ORM\JoinColumn(name: 'character_object_state_id', referencedColumnName: 'id', unique: true, nullable: false, onDelete: 'CASCADE')]
    )]
    private Collection $characterObjectStates;

    public function __construct()
    {
        $this->characterObjectStates = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getSequence(): ?ComboSequences
    {
        return $this->sequence;
    }

    public function setSequence(ComboSequences $sequence): static
    {
        $this->sequence = $sequence;

        return $this;
    }

    public function isCounterHitRequired(): ?bool
    {
        return $this->counter_hit_required;
    }

    public function setCounterHitRequired(bool $counter_hit_required): static
    {
        $this->counter_hit_required = $counter_hit_required;

        return $this;
    }

    public function isPunishCounterRequired(): ?bool
    {
        return $this->punish_counter_required;
    }

    public function setPunishCounterRequired(bool $punish_counter_required): static
    {
        $this->punish_counter_required = $punish_counter_required;

        return $this;
    }

    public function isCornerRequired(): ?bool
    {
        return $this->corner_required;
    }

    public function setCornerRequired(bool $corner_required): static
    {
        $this->corner_required = $corner_required;

        return $this;
    }

    public function isAirborneRequired(): ?bool
    {
        return $this->airborne_required;
    }

    public function setAirborneRequired(bool $airborne_required): static
    {
        $this->airborne_required = $airborne_required;

        return $this;
    }

    public function isNotCrouchingRequired(): ?bool
    {
        return $this->not_crouching_required;
    }

    public function setNotCrouchingRequired(bool $not_crouching_required): static
    {
        $this->not_crouching_required = $not_crouching_required;

        return $this;
    }

    public function isSideSwitchesRequired(): bool
    {
        return $this->side_switches_required;
    }

    public function setSideSwitchesRequired(bool $side_switches_required): static
    {
        $this->side_switches_required = $side_switches_required;

        return $this;
    }

    public function getInitialOpponentPosture(): ?string
    {
        return $this->initialOpponentPosture;
    }

    public function setInitialOpponentPosture(?string $initialOpponentPosture): static
    {
        $this->initialOpponentPosture = $this->normalizeEnum($initialOpponentPosture, [self::POSTURE_STANDING, self::POSTURE_CROUCHING]);

        return $this;
    }

    public function getInitialOpponentGroundState(): ?string
    {
        return $this->initialOpponentGroundState;
    }

    public function setInitialOpponentGroundState(?string $initialOpponentGroundState): static
    {
        $this->initialOpponentGroundState = $this->normalizeEnum($initialOpponentGroundState, [self::GROUND_STATE_GROUNDED, self::GROUND_STATE_AIRBORNE]);

        return $this;
    }

    public function getInitialJuggleAltitude(): ?string
    {
        return $this->initialJuggleAltitude;
    }

    public function setInitialJuggleAltitude(?string $initialJuggleAltitude): static
    {
        $this->initialJuggleAltitude = $this->normalizeEnum($initialJuggleAltitude, [self::JUGGLE_ALTITUDE_LOW, self::JUGGLE_ALTITUDE_MEDIUM, self::JUGGLE_ALTITUDE_HIGH]);

        return $this;
    }

    /** @param list<string> $allowedValues */
    private function normalizeEnum(?string $value, array $allowedValues): ?string
    {
        if (null === $value || '' === trim($value)) {
            return null;
        }

        $normalized = mb_strtolower(trim($value));

        return in_array($normalized, $allowedValues, true) ? $normalized : null;
    }

    public function getCharacterObjectState(): ?CharacterObjectState
    {
        $first = $this->characterObjectStates->first();

        return false === $first ? null : $first;
    }

    public function getRequirementSpecificCharacter(): ?CharacterObjectState
    {
        return $this->getCharacterObjectState();
    }

    /**
     * @return Collection<int, CharacterObjectState>
     */
    public function getCharacterObjectStates(): Collection
    {
        return $this->characterObjectStates;
    }

    /**
     * @return Collection<int, CharacterObjectState>
     */
    public function getRequirementSpecificCharacters(): Collection
    {
        return $this->getCharacterObjectStates();

    }

    public function setCharacterObjectState(CharacterObjectState $characterObjectState): static
    {
        $this->characterObjectStates->clear();
        $this->characterObjectStates->add($characterObjectState);

        return $this;
    }

    public function setRequirementSpecificCharacter(CharacterObjectState $characterObjectState): static
    {
        return $this->setCharacterObjectState($characterObjectState);
    }

    public function addCharacterObjectState(CharacterObjectState $characterObjectState): static
    {
        if (!$this->characterObjectStates->contains($characterObjectState)) {
            $this->characterObjectStates->add($characterObjectState);
        }

        return $this;
    }

    public function addRequirementSpecificCharacter(CharacterObjectState $characterObjectState): static
    {
        return $this->addCharacterObjectState($characterObjectState);
    }
}
