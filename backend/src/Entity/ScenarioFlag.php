<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\ScenarioFlagRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ScenarioFlagRepository::class)]
#[ORM\Table(name: 'scenario_flag', schema: 'sf6')]
class ScenarioFlag
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'scenario_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Scenario $scenario;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'reported_by_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private User $reportedBy;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $comment = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    public function __construct(Scenario $scenario, User $reportedBy, ?string $comment)
    {
        $this->scenario = $scenario;
        $this->reportedBy = $reportedBy;
        $this->comment = $comment;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getScenario(): Scenario
    {
        return $this->scenario;
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
