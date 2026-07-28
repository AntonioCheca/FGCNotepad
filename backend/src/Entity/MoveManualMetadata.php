<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\MoveManualMetadataRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: MoveManualMetadataRepository::class)]
#[ORM\Table(name: 'move_manual_metadata', schema: 'sf6')]
#[ORM\UniqueConstraint(name: 'uniq_move_manual_metadata_move', columns: ['move_id'])]
class MoveManualMetadata
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToOne]
    #[ORM\JoinColumn(name: 'move_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Move $move;

    #[ORM\Column(name: 'whiff_on_crouch', type: Types::BOOLEAN, options: ['default' => false])]
    private bool $whiffOnCrouch = false;

    #[ORM\Column(name: 'forces_standing', type: Types::BOOLEAN, options: ['default' => false])]
    private bool $forcesStanding = false;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'edited_by_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?User $editedBy = null;

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

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getMove(): Move
    {
        return $this->move;
    }

    public function setMove(Move $move): static
    {
        $this->move = $move;

        return $this;
    }

    public function whiffsOnCrouch(): bool
    {
        return $this->whiffOnCrouch;
    }

    public function setWhiffOnCrouch(bool $whiffOnCrouch): static
    {
        $this->whiffOnCrouch = $whiffOnCrouch;
        $this->updatedAt = new \DateTimeImmutable();

        return $this;
    }

    public function forcesStanding(): bool
    {
        return $this->forcesStanding;
    }

    public function setForcesStanding(bool $forcesStanding): static
    {
        $this->forcesStanding = $forcesStanding;
        $this->updatedAt = new \DateTimeImmutable();

        return $this;
    }

    public function getEditedBy(): ?User
    {
        return $this->editedBy;
    }

    public function setEditedBy(?User $editedBy): static
    {
        $this->editedBy = $editedBy;
        $this->updatedAt = new \DateTimeImmutable();

        return $this;
    }
}
