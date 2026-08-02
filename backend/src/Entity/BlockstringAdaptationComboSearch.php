<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'blockstring_adaptation_combo_search', schema: 'sf6')]
#[ORM\Index(name: 'idx_blockstring_adaptation_combo_search_character', columns: ['character_id'])]
#[ORM\Index(name: 'idx_blockstring_adaptation_combo_search_first_move', columns: ['first_move_id'])]
#[ORM\Index(name: 'idx_blockstring_adaptation_combo_search_situation', columns: ['situation_id'])]
#[ORM\Index(name: 'idx_blockstring_adaptation_combo_search_spacing', columns: ['spacing_id'])]
class BlockstringAdaptationComboSearch
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToOne(inversedBy: 'comboSearch')]
    #[ORM\JoinColumn(name: 'adaptation_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?BlockstringAdaptation $adaptation = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'character_id', referencedColumnName: 'id', nullable: false)]
    private ?Character $character = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'first_move_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?Move $firstMove = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'ender_move_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?Move $enderMove = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'situation_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?Situation $situation = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'spacing_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?ComboSpacing $spacing = null;

    #[ORM\Column(name: 'min_damage', nullable: true)] private ?int $minDamage = null;
    #[ORM\Column(name: 'max_damage', nullable: true)] private ?int $maxDamage = null;
    #[ORM\Column(name: 'min_drive_cost', type: Types::DECIMAL, precision: 4, scale: 1, nullable: true)] private ?string $minDriveCost = null;
    #[ORM\Column(name: 'max_drive_cost', type: Types::DECIMAL, precision: 4, scale: 1, nullable: true)] private ?string $maxDriveCost = null;
    #[ORM\Column(name: 'counter_hit_required', type: Types::BOOLEAN, nullable: true)] private ?bool $counterHitRequired = null;
    #[ORM\Column(name: 'punish_counter_required', type: Types::BOOLEAN, nullable: true)] private ?bool $punishCounterRequired = null;
    #[ORM\Column(name: 'corner_required', type: Types::BOOLEAN, nullable: true)] private ?bool $cornerRequired = null;

    public function getId(): ?int { return $this->id; }
    public function getAdaptation(): ?BlockstringAdaptation { return $this->adaptation; }
    public function setAdaptation(?BlockstringAdaptation $adaptation): self { $this->adaptation = $adaptation; return $this; }
    public function getCharacter(): ?Character { return $this->character; }
    public function setCharacter(?Character $character): self { $this->character = $character; return $this; }
    public function getFirstMove(): ?Move { return $this->firstMove; }
    public function setFirstMove(?Move $firstMove): self { $this->firstMove = $firstMove; return $this; }
    public function getEnderMove(): ?Move { return $this->enderMove; }
    public function setEnderMove(?Move $enderMove): self { $this->enderMove = $enderMove; return $this; }
    public function getSituation(): ?Situation { return $this->situation; }
    public function setSituation(?Situation $situation): self { $this->situation = $situation; return $this; }
    public function getSpacing(): ?ComboSpacing { return $this->spacing; }
    public function setSpacing(?ComboSpacing $spacing): self { $this->spacing = $spacing; return $this; }
    public function getMinDamage(): ?int { return $this->minDamage; }
    public function setMinDamage(?int $minDamage): self { $this->minDamage = $minDamage; return $this; }
    public function getMaxDamage(): ?int { return $this->maxDamage; }
    public function setMaxDamage(?int $maxDamage): self { $this->maxDamage = $maxDamage; return $this; }
    public function getMinDriveCost(): ?float { return null === $this->minDriveCost ? null : (float) $this->minDriveCost; }
    public function setMinDriveCost(?float $minDriveCost): self { $this->minDriveCost = null === $minDriveCost ? null : number_format($minDriveCost, 1, '.', ''); return $this; }
    public function getMaxDriveCost(): ?float { return null === $this->maxDriveCost ? null : (float) $this->maxDriveCost; }
    public function setMaxDriveCost(?float $maxDriveCost): self { $this->maxDriveCost = null === $maxDriveCost ? null : number_format($maxDriveCost, 1, '.', ''); return $this; }
    public function getCounterHitRequired(): ?bool { return $this->counterHitRequired; }
    public function setCounterHitRequired(?bool $counterHitRequired): self { $this->counterHitRequired = $counterHitRequired; return $this; }
    public function getPunishCounterRequired(): ?bool { return $this->punishCounterRequired; }
    public function setPunishCounterRequired(?bool $punishCounterRequired): self { $this->punishCounterRequired = $punishCounterRequired; return $this; }
    public function getCornerRequired(): ?bool { return $this->cornerRequired; }
    public function setCornerRequired(?bool $cornerRequired): self { $this->cornerRequired = $cornerRequired; return $this; }
}
