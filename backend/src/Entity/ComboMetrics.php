<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\ComboMetricsRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: ComboMetricsRepository::class)]
#[ORM\Table(name: "combo_metrics", schema: "sf6")]
#[ORM\Index(name: "idx_combo_metrics_damage", columns: ["damage"])]
#[ORM\Index(name: "idx_combo_metrics_difficulty_level", columns: ["difficulty_level"])]
#[ORM\Index(name: "idx_combo_metrics_resource_adjusted_damage", columns: ["resource_adjusted_damage"])]
#[ORM\Index(name: "idx_combo_metrics_drive_cost", columns: ["drive_cost"])]
#[ORM\Index(name: "idx_combo_metrics_super_cost", columns: ["super_cost"])]
#[ORM\Index(name: "idx_combo_metrics_drive_gain", columns: ["drive_gain"])]
#[ORM\Index(name: "idx_combo_metrics_super_gain", columns: ["super_gain"])]
class ComboMetrics
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['combo:read'])]
    private ?int $id = null;

    #[ORM\OneToOne(inversedBy: 'comboMetrics', cascade: ['persist', 'remove'])]
    #[ORM\JoinColumn(nullable: false)]
    private ?ComboSequences $sequence = null;

    #[ORM\Column]
    #[Groups(['combo:read'])]
    private ?int $damage = null;

    #[ORM\Column(name: 'difficulty_level', nullable: true)]
    #[Groups(['combo:read'])]
    private ?int $difficultyLevel = null;

    #[ORM\Column(name: 'drive_cost', nullable: true)]
    #[Groups(['combo:read'])]
    private ?float $driveCost = null;

    #[ORM\Column(name: 'drive_gain', nullable: true)]
    #[Groups(['combo:read'])]
    private ?float $driveGain = null;

    #[ORM\Column(name: 'super_cost', nullable: true)]
    #[Groups(['combo:read'])]
    private ?float $superCost = null;

    #[ORM\Column(name: 'super_gain', nullable: true)]
    #[Groups(['combo:read'])]
    private ?float $superGain = null;

    #[ORM\Column(name: 'resource_adjusted_damage', nullable: true)]
    #[Groups(['combo:read'])]
    private ?float $resourceAdjustedDamage = null;

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

    public function getDamage(): ?int
    {
        return $this->damage;
    }

    public function setDamage(int $damage): static
    {
        $this->damage = $damage;

        return $this;
    }

    public function getDifficultyLevel(): ?int
    {
        return $this->difficultyLevel;
    }

    public function setDifficultyLevel(?int $difficultyLevel): static
    {
        $this->difficultyLevel = $difficultyLevel;

        return $this;
    }

    public function getDriveCost(): ?float
    {
        return $this->driveCost;
    }

    public function setDriveCost(?float $driveCost): static
    {
        $this->driveCost = $driveCost;

        return $this;
    }

    public function getDriveGain(): ?float
    {
        return $this->driveGain;
    }

    public function setDriveGain(?float $driveGain): static
    {
        $this->driveGain = $driveGain;

        return $this;
    }

    public function getSuperCost(): ?float
    {
        return $this->superCost;
    }

    public function setSuperCost(?float $superCost): static
    {
        $this->superCost = $superCost;

        return $this;
    }

    public function getSuperGain(): ?float
    {
        return $this->superGain;
    }

    public function setSuperGain(?float $superGain): static
    {
        $this->superGain = $superGain;

        return $this;
    }

    public function getResourceAdjustedDamage(): ?float
    {
        return $this->resourceAdjustedDamage;
    }

    public function setResourceAdjustedDamage(?float $resourceAdjustedDamage): static
    {
        $this->resourceAdjustedDamage = $resourceAdjustedDamage;

        return $this;
    }
}
