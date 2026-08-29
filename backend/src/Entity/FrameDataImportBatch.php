<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\FrameDataImportBatchRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: FrameDataImportBatchRepository::class)]
#[ORM\Table(name: 'frame_data_import_batch', schema: 'sf6')]
class FrameDataImportBatch
{
    public const SOURCE_UPSTREAM = 'upstream';
    public const SOURCE_SUPPLEMENTAL = 'supplemental';
    public const STATUS_COMPLETED = 'completed';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'source_type', type: Types::STRING, length: 32)]
    private string $sourceType;

    #[ORM\Column(type: Types::STRING, length: 160)]
    private string $label;

    #[ORM\Column(name: 'source_reference', type: Types::TEXT, nullable: true)]
    private ?string $sourceReference = null;

    #[ORM\Column(name: 'source_version', type: Types::STRING, length: 64)]
    private string $sourceVersion = 'legacy-unknown';

    #[ORM\Column(name: 'source_checksum', type: Types::STRING, length: 64, nullable: true)]
    private ?string $sourceChecksum = null;

    #[ORM\Column(type: Types::STRING, length: 32)]
    private string $status = self::STATUS_COMPLETED;

    #[ORM\Column(name: 'is_active', type: Types::BOOLEAN, options: ['default' => true])]
    private bool $active = true;

    #[ORM\Column(name: 'imported_at', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $importedAt;

    #[ORM\Column(name: 'completed_at', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $completedAt = null;

    #[ORM\Column(name: 'retired_at', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $retiredAt = null;

    public function __construct()
    {
        $this->importedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getSourceType(): string
    {
        return $this->sourceType;
    }

    public function setSourceType(string $sourceType): static
    {
        if (!in_array($sourceType, [self::SOURCE_UPSTREAM, self::SOURCE_SUPPLEMENTAL], true)) {
            throw new \InvalidArgumentException(sprintf('Unsupported frame-data source type "%s".', $sourceType));
        }

        $this->sourceType = $sourceType;

        return $this;
    }

    public function getLabel(): string
    {
        return $this->label;
    }

    public function setLabel(string $label): static
    {
        $trimmed = trim($label);
        if ('' === $trimmed) {
            throw new \InvalidArgumentException('Import batch label cannot be empty.');
        }

        $this->label = $trimmed;

        return $this;
    }

    public function getSourceReference(): ?string
    {
        return $this->sourceReference;
    }

    public function setSourceReference(?string $sourceReference): static
    {
        $this->sourceReference = null === $sourceReference || '' === trim($sourceReference) ? null : trim($sourceReference);

        return $this;
    }

    public function getSourceVersion(): string
    {
        return $this->sourceVersion;
    }

    public function setSourceVersion(string $sourceVersion): static
    {
        $trimmed = trim($sourceVersion);
        if ('' === $trimmed) {
            throw new \InvalidArgumentException('Import batch source version cannot be empty.');
        }

        $this->sourceVersion = $trimmed;

        return $this;
    }

    public function getSourceChecksum(): ?string
    {
        return $this->sourceChecksum;
    }

    public function setSourceChecksum(?string $sourceChecksum): static
    {
        $this->sourceChecksum = null === $sourceChecksum || '' === trim($sourceChecksum) ? null : trim($sourceChecksum);

        return $this;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $trimmed = trim($status);
        if ('' === $trimmed) {
            throw new \InvalidArgumentException('Import batch status cannot be empty.');
        }

        $this->status = $trimmed;

        return $this;
    }

    public function isActive(): bool
    {
        return $this->active;
    }

    public function retire(): static
    {
        $this->active = false;
        $this->retiredAt = new \DateTimeImmutable();

        return $this;
    }

    public function getImportedAt(): \DateTimeImmutable
    {
        return $this->importedAt;
    }

    public function markCompleted(): static
    {
        $this->status = self::STATUS_COMPLETED;
        $this->completedAt = new \DateTimeImmutable();

        return $this;
    }

    public function getCompletedAt(): ?\DateTimeImmutable
    {
        return $this->completedAt;
    }

    public function getRetiredAt(): ?\DateTimeImmutable
    {
        return $this->retiredAt;
    }
}
