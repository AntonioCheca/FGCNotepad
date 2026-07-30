<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\ReversalPropertyRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ReversalPropertyRepository::class)]
#[ORM\Table(name: 'reversal_property', schema: 'sf6')]
#[ORM\Index(name: 'idx_reversal_property_reversal', columns: ['character_reversal_id'])]
#[ORM\Index(name: 'idx_reversal_property_property', columns: ['property'])]
class ReversalProperty
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'properties')]
    #[ORM\JoinColumn(name: 'character_reversal_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private CharacterReversal $reversal;

    #[ORM\Column(length: 48)]
    private string $property;

    public function getId(): ?int { return $this->id; }
    public function getReversal(): CharacterReversal { return $this->reversal; }
    public function setReversal(CharacterReversal $reversal): self { $this->reversal = $reversal; return $this; }
    public function getProperty(): string { return $this->property; }
    public function setProperty(string $property): self { $this->property = $property; return $this; }
}
