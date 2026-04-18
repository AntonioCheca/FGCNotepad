<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\ComboRequirementRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ComboRequirementRepository::class)]
#[ORM\Table(name: "combo_requirement", schema: "sf6")]
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
    private ?bool $mid_screen_required = null;

    #[ORM\Column]
    private ?bool $not_crouching_required = null;

    #[ORM\OneToOne(mappedBy: 'requirement', cascade: ['persist', 'remove'])]
    private ?RequirementSpecificCharacter $requirementSpecificCharacter = null;

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

    public function isMidScreenRequired(): ?bool
    {
        return $this->mid_screen_required;
    }

    public function setMidScreenRequired(bool $mid_screen_required): static
    {
        $this->mid_screen_required = $mid_screen_required;

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

    public function getRequirementSpecificCharacter(): ?RequirementSpecificCharacter
    {
        return $this->requirementSpecificCharacter;
    }

    public function setRequirementSpecificCharacter(RequirementSpecificCharacter $requirementSpecificCharacter): static
    {
        // set the owning side of the relation if necessary
        if ($requirementSpecificCharacter->getRequirement() !== $this) {
            $requirementSpecificCharacter->setRequirement($this);
        }

        $this->requirementSpecificCharacter = $requirementSpecificCharacter;

        return $this;
    }
}
