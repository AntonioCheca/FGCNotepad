<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\FrameDataOverrideRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: FrameDataOverrideRepository::class)]
#[ORM\Table(name: 'frame_data_override', schema: 'sf6')]
#[ORM\UniqueConstraint(name: 'uniq_frame_data_override_field', columns: ['frame_data_id', 'column_name'])]
class FrameDataOverride
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'frame_data_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private FrameData $frameData;

    #[ORM\Column(name: 'column_name', type: Types::STRING, length: 64)]
    private string $columnName;

    #[ORM\Column(name: 'override_value', type: Types::JSON)]
    private mixed $overrideValue = null;

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

    public function getFrameData(): FrameData
    {
        return $this->frameData;
    }

    public function setFrameData(FrameData $frameData): static
    {
        $this->frameData = $frameData;

        return $this;
    }

    public function getColumnName(): string
    {
        return $this->columnName;
    }

    public function setColumnName(string $columnName): static
    {
        $this->columnName = $columnName;

        return $this;
    }

    public function getOverrideValue(): mixed
    {
        return $this->overrideValue;
    }

    public function setOverrideValue(mixed $overrideValue): static
    {
        $this->overrideValue = $overrideValue;
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

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }
}
