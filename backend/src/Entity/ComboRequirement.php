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
