<?php

namespace App\Entity;

use App\Repository\UserComboRepository;
use Doctrine\ORM\Mapping as ORM;


#[ORM\Table(name: 'user_combo', schema: 'sf6')]
#[ORM\Entity(repositoryClass: UserComboRepository::class)]
class UserCombo
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'userCombos')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user_name = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?ComboSequences $combo = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUserName(): ?User
    {
        return $this->user_name;
    }

    public function setUserName(?User $user_name): static
    {
        $this->user_name = $user_name;

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
}
