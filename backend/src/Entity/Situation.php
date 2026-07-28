<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\SituationRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: SituationRepository::class)]
#[ORM\Table(name: 'situation', schema: 'sf6')]
#[ORM\Index(name: 'idx_situation_state_filters', columns: ['opponent_state', 'corner_state', 'counter_hit_state'])]
class Situation
{
    public const OPPONENT_STATE_GROUNDED = 'grounded';
    public const OPPONENT_STATE_AIRBORNE = 'airborne';
    public const ALTITUDE_LOW = 'low';
    public const ALTITUDE_MEDIUM = 'medium';
    public const ALTITUDE_HIGH = 'high';
    public const CORNER_MIDSCREEN = 'midscreen';
    public const CORNER_CORNER = 'corner';
    public const CORNER_EITHER = 'either';
    public const COUNTER_NORMAL = 'normal';
    public const COUNTER_COUNTER_HIT = 'counter_hit';
    public const COUNTER_PUNISH_COUNTER = 'punish_counter';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'type_id', referencedColumnName: 'id', nullable: false)]
    private SituationType $type;

    #[ORM\Column(type: Types::STRING, length: 160)]
    private string $name = '';

    #[ORM\Column(type: Types::TEXT)]
    private string $description = '';

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'opponent_character_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?Character $opponentCharacter = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'move_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?Move $move = null;

    #[ORM\Column(name: 'frame_advantage', type: Types::SMALLINT, nullable: true)]
    private ?int $frameAdvantage = null;

    #[ORM\Column(name: 'punish_window_frames', type: Types::SMALLINT, nullable: true)]
    private ?int $punishWindowFrames = null;

    #[ORM\Column(name: 'starting_distance_meters', type: Types::DECIMAL, precision: 6, scale: 3, nullable: true)]
    private ?string $startingDistanceMeters = null;

    #[ORM\Column(name: 'opponent_state', type: Types::STRING, length: 32)]
    private string $opponentState = self::OPPONENT_STATE_GROUNDED;

    #[ORM\Column(name: 'initial_juggle_altitude', type: Types::STRING, length: 32, nullable: true)]
    private ?string $initialJuggleAltitude = null;

    #[ORM\Column(name: 'corner_state', type: Types::STRING, length: 32)]
    private string $cornerState = self::CORNER_EITHER;

    #[ORM\Column(name: 'counter_hit_state', type: Types::STRING, length: 32)]
    private string $counterHitState = self::COUNTER_NORMAL;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $notes = null;

    #[ORM\Column(name: 'is_verified', type: Types::BOOLEAN, options: ['default' => false])]
    private bool $isVerified = false;

    #[ORM\Column(name: 'is_archived', type: Types::BOOLEAN, options: ['default' => false])]
    private bool $isArchived = false;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'created_by_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?User $createdBy = null;

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

    public function getId(): ?int { return $this->id; }
    public function getType(): SituationType { return $this->type; }
    public function setType(SituationType $type): static { $this->type = $type; $this->touch(); return $this; }
    public function getName(): string { return $this->name; }
    public function setName(string $name): static { $this->name = $name; $this->touch(); return $this; }
    public function getDescription(): string { return $this->description; }
    public function setDescription(string $description): static { $this->description = $description; $this->touch(); return $this; }
    public function getOpponentCharacter(): ?Character { return $this->opponentCharacter; }
    public function setOpponentCharacter(?Character $opponentCharacter): static { $this->opponentCharacter = $opponentCharacter; $this->touch(); return $this; }
    public function getMove(): ?Move { return $this->move; }
    public function setMove(?Move $move): static { $this->move = $move; $this->touch(); return $this; }
    public function getFrameAdvantage(): ?int { return $this->frameAdvantage; }
    public function setFrameAdvantage(?int $frameAdvantage): static { $this->frameAdvantage = $frameAdvantage; $this->touch(); return $this; }
    public function getPunishWindowFrames(): ?int { return $this->punishWindowFrames; }
    public function setPunishWindowFrames(?int $punishWindowFrames): static { $this->punishWindowFrames = $punishWindowFrames; $this->touch(); return $this; }
    public function getStartingDistanceMeters(): ?float { return null === $this->startingDistanceMeters ? null : (float) $this->startingDistanceMeters; }
    public function setStartingDistanceMeters(?float $startingDistanceMeters): static { $this->startingDistanceMeters = null === $startingDistanceMeters ? null : number_format($startingDistanceMeters, 3, '.', ''); $this->touch(); return $this; }
    public function getOpponentState(): string { return $this->opponentState; }
    public function setOpponentState(string $opponentState): static { $this->opponentState = $opponentState; $this->touch(); return $this; }
    public function getInitialJuggleAltitude(): ?string { return $this->initialJuggleAltitude; }
    public function setInitialJuggleAltitude(?string $initialJuggleAltitude): static { $this->initialJuggleAltitude = $initialJuggleAltitude; $this->touch(); return $this; }
    public function getCornerState(): string { return $this->cornerState; }
    public function setCornerState(string $cornerState): static { $this->cornerState = $cornerState; $this->touch(); return $this; }
    public function getCounterHitState(): string { return $this->counterHitState; }
    public function setCounterHitState(string $counterHitState): static { $this->counterHitState = $counterHitState; $this->touch(); return $this; }
    public function getNotes(): ?string { return $this->notes; }
    public function setNotes(?string $notes): static { $this->notes = $notes; $this->touch(); return $this; }
    public function isVerified(): bool { return $this->isVerified; }
    public function setIsVerified(bool $isVerified): static { $this->isVerified = $isVerified; $this->touch(); return $this; }
    public function isArchived(): bool { return $this->isArchived; }
    public function setIsArchived(bool $isArchived): static { $this->isArchived = $isArchived; $this->touch(); return $this; }
    public function getCreatedBy(): ?User { return $this->createdBy; }
    public function setCreatedBy(?User $createdBy): static { $this->createdBy = $createdBy; $this->touch(); return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updatedAt; }

    private function touch(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }
}
