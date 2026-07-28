<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\SituationTypeRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: SituationTypeRepository::class)]
#[ORM\Table(name: 'situation_type', schema: 'sf6')]
#[ORM\UniqueConstraint(name: 'uniq_situation_type_code', columns: ['code'])]
class SituationType
{
    public const BLOCKED_MOVE = 'blocked_move';
    public const WHIFFED_MOVE = 'whiffed_move';
    public const DRIVE_IMPACT_PC_STATE = 'drive_impact_pc_state';
    public const STUN = 'stun';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: Types::STRING, length: 64)]
    private string $code = '';

    #[ORM\Column(type: Types::STRING, length: 120)]
    private string $name = '';

    #[ORM\Column(type: Types::TEXT)]
    private string $description = '';

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $updatedAt;

    public function __construct()
    {
        $now = new \DateTimeImmutable();
        $this->createdAt = $now;
        $this->updatedAt = $now;
    }

    public function getId(): ?int { return $this->id; }
    public function getCode(): string { return $this->code; }
    public function setCode(string $code): static { $this->code = $code; $this->updatedAt = new \DateTimeImmutable(); return $this; }
    public function getName(): string { return $this->name; }
    public function setName(string $name): static { $this->name = $name; $this->updatedAt = new \DateTimeImmutable(); return $this; }
    public function getDescription(): string { return $this->description; }
    public function setDescription(string $description): static { $this->description = $description; $this->updatedAt = new \DateTimeImmutable(); return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updatedAt; }
}
