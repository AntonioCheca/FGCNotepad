<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\ComboFlagRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ComboFlagRepository::class)]
#[ORM\Table(name: 'combo_flag', schema: 'sf6')]
class ComboFlag
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'combo_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ComboSequences $combo;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'reported_by_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private User $reportedBy;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $comment = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    public function __construct(ComboSequences $combo, User $reportedBy, ?string $comment)
    {
        $this->combo = $combo;
        $this->reportedBy = $reportedBy;
        $this->comment = $comment;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCombo(): ComboSequences
    {
        return $this->combo;
    }

    public function getReportedBy(): User
    {
        return $this->reportedBy;
    }

    public function getComment(): ?string
    {
        return $this->comment;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}
