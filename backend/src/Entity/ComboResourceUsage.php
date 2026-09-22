<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\ComboResourceUsageRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/** Derived per-combo ledger for one resource: assumed start, what the combo spends/gains, and the end value. */
#[ORM\Entity(repositoryClass: ComboResourceUsageRepository::class)]
#[ORM\Table(name: 'combo_resource_usage', schema: 'sf6')]
#[ORM\UniqueConstraint(name: 'uniq_combo_resource_usage', columns: ['combo_id', 'character_object_id'])]
#[ORM\Index(name: 'idx_combo_resource_usage_object', columns: ['character_object_id'])]
class ComboResourceUsage
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'combo_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ComboSequences $combo;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'character_object_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private CharacterObject $characterObject;

    #[ORM\Column(name: 'start_value', type: Types::INTEGER)]
    private int $startValue = 0;

    #[ORM\Column(type: Types::INTEGER)]
    private int $spent = 0;

    #[ORM\Column(type: Types::INTEGER)]
    private int $gained = 0;

    #[ORM\Column(name: 'end_value', type: Types::INTEGER)]
    private int $endValue = 0;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCombo(): ComboSequences
    {
        return $this->combo;
    }

    public function setCombo(ComboSequences $combo): static
    {
        $this->combo = $combo;

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

    public function getStartValue(): int
    {
        return $this->startValue;
    }

    public function setStartValue(int $startValue): static
    {
        $this->startValue = $startValue;

        return $this;
    }

    public function getSpent(): int
    {
        return $this->spent;
    }

    public function setSpent(int $spent): static
    {
        $this->spent = $spent;

        return $this;
    }

    public function getGained(): int
    {
        return $this->gained;
    }

    public function setGained(int $gained): static
    {
        $this->gained = $gained;

        return $this;
    }

    public function getEndValue(): int
    {
        return $this->endValue;
    }

    public function setEndValue(int $endValue): static
    {
        $this->endValue = $endValue;

        return $this;
    }
}
