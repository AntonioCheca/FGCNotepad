<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\RegistrationInviteCodeRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: RegistrationInviteCodeRepository::class)]
#[ORM\Table(name: 'registration_invite_code', schema: 'forum')]
#[ORM\UniqueConstraint(name: 'UNIQ_REGISTRATION_INVITE_CODE_HASH', fields: ['codeHash'])]
class RegistrationInviteCode
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    #[ORM\Column(name: 'code_hash', length: 64)]
    private string $codeHash;

    #[ORM\Column(length: 180, nullable: true)]
    private ?string $label = null;

    #[ORM\Column(name: 'is_used', type: Types::BOOLEAN, options: ['default' => false])]
    private bool $isUsed = false;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'used_by_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?User $usedBy = null;

    #[ORM\Column(name: 'used_at', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $usedAt = null;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getCodeHash(): string
    {
        return $this->codeHash;
    }

    public function setCodeHash(string $codeHash): static
    {
        $this->codeHash = $codeHash;

        return $this;
    }

    public function getLabel(): ?string
    {
        return $this->label;
    }

    public function setLabel(?string $label): static
    {
        $normalizedLabel = null === $label ? null : trim($label);
        $this->label = '' === $normalizedLabel ? null : $normalizedLabel;

        return $this;
    }

    public function isUsed(): bool
    {
        return $this->isUsed;
    }

    public function getUsedBy(): ?User
    {
        return $this->usedBy;
    }

    public function getUsedAt(): ?\DateTimeImmutable
    {
        return $this->usedAt;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function markUsedBy(User $user): void
    {
        $this->isUsed = true;
        $this->usedBy = $user;
        $this->usedAt = new \DateTimeImmutable();
    }
}
