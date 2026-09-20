<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/** A combo seen in a replay, performed by the player in the given slot. The combo itself stays content-deduplicated. */
#[ORM\Entity]
#[ORM\Table(name: 'combo_observation', schema: 'sf6')]
#[ORM\UniqueConstraint(name: 'uniq_combo_observation_replay_occurrence', columns: ['replay_id', 'occurrence_id'])]
#[ORM\Index(name: 'idx_combo_observation_combo', columns: ['combo_id'])]
#[ORM\Index(name: 'idx_combo_observation_performer', columns: ['performer_id'])]
class ComboObservation
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'combo_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ComboSequences $combo;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'replay_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Replay $replay;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'performer_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?ReplayPlayer $performer;

    #[ORM\Column(name: 'occurrence_id', type: Types::STRING, length: 64)]
    private string $occurrenceId;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    private ?int $damage;

    /** In-game seconds left at the first damaging contact (counts down). */
    #[ORM\Column(name: 'start_round_timer', type: Types::INTEGER, nullable: true)]
    private ?int $startRoundTimer;

    /** Raw stage timer: provenance only (can repeat or run backwards), not a video timestamp. */
    #[ORM\Column(name: 'start_replay_frame', type: Types::INTEGER, nullable: true)]
    private ?int $startReplayFrame;

    #[ORM\Column(name: 'start_source_index', type: Types::INTEGER, nullable: true)]
    private ?int $startSourceIndex;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    public function __construct(ComboSequences $combo, Replay $replay, ?ReplayPlayer $performer, string $occurrenceId, ?int $damage, ?int $startRoundTimer = null, ?int $startReplayFrame = null, ?int $startSourceIndex = null)
    {
        $this->combo = $combo;
        $this->replay = $replay;
        $this->performer = $performer;
        $this->occurrenceId = $occurrenceId;
        $this->damage = $damage;
        $this->startRoundTimer = $startRoundTimer;
        $this->startReplayFrame = $startReplayFrame;
        $this->startSourceIndex = $startSourceIndex;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getCombo(): ComboSequences { return $this->combo; }
    public function getReplay(): Replay { return $this->replay; }
    public function getPerformer(): ?ReplayPlayer { return $this->performer; }
    public function getOccurrenceId(): string { return $this->occurrenceId; }
    public function getDamage(): ?int { return $this->damage; }
    public function getStartRoundTimer(): ?int { return $this->startRoundTimer; }
    public function getStartReplayFrame(): ?int { return $this->startReplayFrame; }
    public function getStartSourceIndex(): ?int { return $this->startSourceIndex; }
}
