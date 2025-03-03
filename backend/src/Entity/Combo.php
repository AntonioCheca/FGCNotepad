<?php declare(strict_types=1);


namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Table(name: "combo", schema: "sf6")]
#[ORM\Entity]
class Combo extends Component
{
    #[ORM\Column(type: Types::TEXT)]
    private string $numpadNotation;

    #[ORM\Column(type: "integer")]
    private int $damage;

    public function getNumpadNotation(): string
    {
        return $this->numpadNotation;
    }

    public function setNumpadNotation(string $numpadNotation): self
    {
        $this->numpadNotation = $numpadNotation;
        return $this;
    }

    public function getDamage(): int
    {
        return $this->damage;
    }

    public function setDamage(int $damage): self
    {
        $this->damage = $damage;
        return $this;
    }
}
