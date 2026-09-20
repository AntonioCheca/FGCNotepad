<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/** An Oki setup seen in a replay, with the attacker and defender players. The setup stays content-deduplicated. */
#[ORM\Entity]
#[ORM\Table(name: 'oki_setup_observation', schema: 'sf6')]
#[ORM\UniqueConstraint(name: 'uniq_oki_setup_observation_replay_occurrence', columns: ['replay_id', 'occurrence_id'])]
#[ORM\Index(name: 'idx_oki_setup_observation_setup', columns: ['setup_id'])]
#[ORM\Index(name: 'idx_oki_setup_observation_attacker', columns: ['attacker_id'])]
class OkiSetupObservation
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'setup_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private OkiSetup $setup;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'replay_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Replay $replay;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'attacker_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?ReplayPlayer $attacker;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'defender_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?ReplayPlayer $defender;

    #[ORM\Column(name: 'occurrence_id', type: Types::STRING, length: 64)]
    private string $occurrenceId;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    public function __construct(OkiSetup $setup, Replay $replay, ?ReplayPlayer $attacker, ?ReplayPlayer $defender, string $occurrenceId)
    {
        $this->setup = $setup;
        $this->replay = $replay;
        $this->attacker = $attacker;
        $this->defender = $defender;
        $this->occurrenceId = $occurrenceId;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getSetup(): OkiSetup { return $this->setup; }
    public function getReplay(): Replay { return $this->replay; }
    public function getAttacker(): ?ReplayPlayer { return $this->attacker; }
    public function getDefender(): ?ReplayPlayer { return $this->defender; }
    public function getOccurrenceId(): string { return $this->occurrenceId; }
}
