<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\CharacterModernAutoComboRepository;
use App\Util\Enum\ModernAutoComboStrength;
use Doctrine\ORM\Mapping as ORM;

/** Points a character's Light/Medium/Heavy Modern auto combo at the stored combo that spells out its moves. */
#[ORM\Entity(repositoryClass: CharacterModernAutoComboRepository::class)]
#[ORM\Table(name: 'character_modern_auto_combo', schema: 'sf6')]
#[ORM\UniqueConstraint(name: 'uniq_character_modern_auto_combo_strength', columns: ['character_id', 'strength'])]
#[ORM\Index(name: 'idx_character_modern_auto_combo_combo', columns: ['combo_id'])]
class CharacterModernAutoCombo
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'character_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Character $character;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'combo_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ComboSequences $combo;

    #[ORM\Column(length: 8, enumType: ModernAutoComboStrength::class)]
    private ModernAutoComboStrength $strength;

    public function __construct(Character $character, ModernAutoComboStrength $strength, ComboSequences $combo)
    {
        $this->character = $character;
        $this->strength = $strength;
        $this->combo = $combo;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCharacter(): Character
    {
        return $this->character;
    }

    public function getStrength(): ModernAutoComboStrength
    {
        return $this->strength;
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
}
