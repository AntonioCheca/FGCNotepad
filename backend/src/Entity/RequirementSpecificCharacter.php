<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\RequirementSpecificCharacterRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: RequirementSpecificCharacterRepository::class)]
#[ORM\Table(name: "requirement_specific_character", schema: "sf6")]
#[ORM\Index(name: "idx_requirement_specific_character_object_status", columns: ["object_name", "status_required"])]
class RequirementSpecificCharacter
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $object_name = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $status_required = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getObjectName(): ?string
    {
        return $this->object_name;
    }

    public function setObjectName(string $object_name): static
    {
        $this->object_name = $object_name;

        return $this;
    }

    public function getStatusRequired(): ?string
    {
        return $this->status_required;
    }

    public function setStatusRequired(string $status_required): static
    {
        $this->status_required = $status_required;

        return $this;
    }

}
