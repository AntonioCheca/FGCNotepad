<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\UserComboRepository;
use Doctrine\ORM\Mapping as ORM;
#[ORM\Table(name: 'user_combo', schema: 'sf6')]
#[ORM\UniqueConstraint(name: 'uniq_user_combo_character', columns: ['user_id', 'character_id', 'combo_id'])]
#[ORM\Entity(repositoryClass: UserComboRepository::class)]
class UserCombo
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'userCombos')]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false)]
    private ?User $user = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'character_id', referencedColumnName: 'id', nullable: false)]
    private ?Character $character = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'combo_id', referencedColumnName: 'id', nullable: false)]
    private ?ComboSequences $combo = null;

    #[ORM\Column(options: ['default' => true])]
    private bool $known = true;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getCharacter(): ?Character
    {
        return $this->character;
    }

    public function setCharacter(?Character $character): static
    {
        $this->character = $character;

        return $this;
    }

    public function getCombo(): ?ComboSequences
    {
        return $this->combo;
    }

    public function setCombo(?ComboSequences $combo): static
    {
        $this->combo = $combo;

        return $this;
    }

    public function isKnown(): bool
    {
        return $this->known;
    }

    public function setKnown(bool $known): static
    {
        $this->known = $known;

        return $this;
    }
}
