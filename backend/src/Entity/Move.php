<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Table(name: "move", schema: "sf6")]
#[ORM\Entity]
class Move extends Component
{
    #[ORM\Column(type: Types::TEXT)]
    private string $numpadNotation;

    #[ORM\Column(type: "integer")]
    private int $startup;

    public function getNumpadNotation(): string
    {
        return $this->numpadNotation;
    }

    public function setNumpadNotation(string $numpadNotation): self
    {
        $this->numpadNotation = $numpadNotation;
        return $this;
    }

    public function getStartup(): int
    {
        return $this->startup;
    }

    public function setStartup(int $startup): self
    {
        $this->startup = $startup;
        return $this;
    }
}
