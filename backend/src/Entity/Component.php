<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity]
#[ORM\Table(name: "component", schema: "sf6")]
#[ORM\InheritanceType("JOINED")]
#[ORM\DiscriminatorColumn(name: "type", type: "string")]
#[ORM\DiscriminatorMap(["move" => Move::class])]
abstract class Component
{
    #[ORM\Id]
    #[ORM\Column(type: "uuid", unique: true)]
    #[ORM\GeneratedValue(strategy: "CUSTOM")]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    #[Groups(["move:read", "character:read"])]
    private ?Uuid $id = null;

    public function getId(): ?Uuid
    {
        return $this->id;
    }
}
