<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'blockstring_offense_plan', schema: 'sf6')]
#[ORM\Index(name: 'idx_blockstring_offense_plan_sequence', columns: ['sequence_id'])]
class BlockstringOffensePlan
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'offensePlans')]
    #[ORM\JoinColumn(name: 'sequence_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?BlockstringSequence $sequence = null;

    #[ORM\Column(type: Types::TEXT)]
    private string $label = '';

    #[ORM\Column(name: 'plan_role', type: Types::STRING, length: 40)]
    private string $planRole = 'situational';

    #[ORM\Column(name: 'target_behavior', type: Types::STRING, length: 80, nullable: true)]
    private ?string $targetBehavior = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $purpose = null;

    #[ORM\Column(name: 'on_hit', type: Types::TEXT, nullable: true)]
    private ?string $onHit = null;

    #[ORM\Column(name: 'on_block', type: Types::TEXT, nullable: true)]
    private ?string $onBlock = null;

    #[ORM\Column(name: 'loses_to', type: Types::TEXT, nullable: true)]
    private ?string $losesTo = null;

    #[ORM\Column(name: 'author_explanation', type: Types::TEXT, nullable: true)]
    private ?string $authorExplanation = null;

    #[ORM\Column(name: 'sort_order', options: ['default' => 0])]
    private int $sortOrder = 0;

    public function getId(): ?int { return $this->id; }
    public function getSequence(): ?BlockstringSequence { return $this->sequence; }
    public function setSequence(?BlockstringSequence $sequence): self { $this->sequence = $sequence; return $this; }
    public function getLabel(): string { return $this->label; }
    public function setLabel(string $label): self { $this->label = $label; return $this; }
    public function getPlanRole(): string { return $this->planRole; }
    public function setPlanRole(string $planRole): self { $this->planRole = $planRole; return $this; }
    public function getTargetBehavior(): ?string { return $this->targetBehavior; }
    public function setTargetBehavior(?string $targetBehavior): self { $this->targetBehavior = $targetBehavior; return $this; }
    public function getPurpose(): ?string { return $this->purpose; }
    public function setPurpose(?string $purpose): self { $this->purpose = $purpose; return $this; }
    public function getOnHit(): ?string { return $this->onHit; }
    public function setOnHit(?string $onHit): self { $this->onHit = $onHit; return $this; }
    public function getOnBlock(): ?string { return $this->onBlock; }
    public function setOnBlock(?string $onBlock): self { $this->onBlock = $onBlock; return $this; }
    public function getLosesTo(): ?string { return $this->losesTo; }
    public function setLosesTo(?string $losesTo): self { $this->losesTo = $losesTo; return $this; }
    public function getAuthorExplanation(): ?string { return $this->authorExplanation; }
    public function setAuthorExplanation(?string $authorExplanation): self { $this->authorExplanation = $authorExplanation; return $this; }
    public function getSortOrder(): int { return $this->sortOrder; }
    public function setSortOrder(int $sortOrder): self { $this->sortOrder = $sortOrder; return $this; }
}
