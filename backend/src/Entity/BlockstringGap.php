<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'blockstring_gap', schema: 'sf6')]
#[ORM\Index(name: 'idx_blockstring_gap_sequence', columns: ['sequence_id'])]
#[ORM\Index(name: 'idx_blockstring_gap_step', columns: ['step_id'])]
class BlockstringGap
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'gaps')]
    #[ORM\JoinColumn(name: 'sequence_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?BlockstringSequence $sequence = null;

    #[ORM\ManyToOne(inversedBy: 'gaps')]
    #[ORM\JoinColumn(name: 'step_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?BlockstringSequenceStep $step = null;

    #[ORM\Column(type: Types::STRING, length: 32)]
    private string $timing = 'before_step';

    #[ORM\Column]
    private int $frames = 0;

    #[ORM\Column(name: 'attacker_frame_advantage')]
    private int $attackerFrameAdvantage = 0;

    #[ORM\Column(type: Types::STRING, length: 16)]
    private string $classification = 'safe';

    public function getId(): ?int { return $this->id; }
    public function getSequence(): ?BlockstringSequence { return $this->sequence; }
    public function setSequence(?BlockstringSequence $sequence): self { $this->sequence = $sequence; return $this; }
    public function getStep(): ?BlockstringSequenceStep { return $this->step; }
    public function setStep(?BlockstringSequenceStep $step): self { $this->step = $step; return $this; }
    public function getTiming(): string { return $this->timing; }
    public function setTiming(string $timing): self { $this->timing = $timing; return $this; }
    public function getFrames(): int { return $this->frames; }
    public function setFrames(int $frames): self { $this->frames = $frames; return $this; }
    public function getAttackerFrameAdvantage(): int { return $this->attackerFrameAdvantage; }
    public function setAttackerFrameAdvantage(int $attackerFrameAdvantage): self { $this->attackerFrameAdvantage = $attackerFrameAdvantage; return $this; }
    public function getClassification(): string { return $this->classification; }
    public function setClassification(string $classification): self { $this->classification = $classification; return $this; }
}
