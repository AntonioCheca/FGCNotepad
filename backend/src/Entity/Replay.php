<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * One row per extractor replay id. Every metadata field is nullable and stored exactly as exported:
 * a null means "not reported", never "false" or "zero".
 */
#[ORM\Entity]
#[ORM\Table(name: 'replay', schema: 'sf6')]
#[ORM\UniqueConstraint(name: 'uniq_replay_extractor_replay_id', columns: ['extractor_replay_id'])]
class Replay
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'extractor_replay_id', type: Types::STRING, length: 64)]
    private string $extractorReplayId;

    #[ORM\Column(name: 'source_sha256', type: Types::STRING, length: 64)]
    private string $sourceSha256;

    #[ORM\Column(name: 'extractor_schema_version', type: Types::STRING, length: 32, nullable: true)]
    private ?string $extractorSchemaVersion = null;

    #[ORM\Column(name: 'metadata_available', type: Types::BOOLEAN, options: ['default' => false])]
    private bool $metadataAvailable = false;

    /** Upload time reported by the game: best available proxy for the match date, not confirmed as the match time. */
    #[ORM\Column(name: 'uploaded_at', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $uploadedAt = null;

    #[ORM\Column(name: 'uploaded_at_raw', type: Types::BIGINT, nullable: true)]
    private ?string $uploadedAtRaw = null;

    #[ORM\Column(name: 'uploaded_at_unit', type: Types::STRING, length: 8, nullable: true)]
    private ?string $uploadedAtUnit = null;

    /** When the extractor captured the replay (someone watched it). Provenance only, never the match date. */
    #[ORM\Column(name: 'captured_at', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $capturedAt = null;

    #[ORM\Column(name: 'battle_version', type: Types::INTEGER, nullable: true)]
    private ?int $battleVersion = null;

    #[ORM\Column(name: 'local_version', type: Types::INTEGER, nullable: true)]
    private ?int $localVersion = null;

    #[ORM\Column(name: 'round_num', type: Types::SMALLINT, nullable: true)]
    private ?int $roundNum = null;

    #[ORM\Column(name: 'stage_id', type: Types::INTEGER, nullable: true)]
    private ?int $stageId = null;

    #[ORM\Column(name: 'battle_type_raw', type: Types::INTEGER, nullable: true)]
    private ?int $battleTypeRaw = null;

    #[ORM\Column(name: 'game_mode_raw', type: Types::INTEGER, nullable: true)]
    private ?int $gameModeRaw = null;

    #[ORM\Column(name: 'battle_sub_type_raw', type: Types::INTEGER, nullable: true)]
    private ?int $battleSubTypeRaw = null;

    #[ORM\Column(name: 'replay_tab_raw', type: Types::INTEGER, nullable: true)]
    private ?int $replayTabRaw = null;

    #[ORM\Column(name: 'battle_type', type: Types::STRING, length: 64, nullable: true)]
    private ?string $battleType = null;

    #[ORM\Column(name: 'game_mode', type: Types::STRING, length: 64, nullable: true)]
    private ?string $gameMode = null;

    #[ORM\Column(name: 'replay_tab', type: Types::STRING, length: 64, nullable: true)]
    private ?string $replayTab = null;

    #[ORM\Column(name: 'is_registered', type: Types::BOOLEAN, nullable: true)]
    private ?bool $isRegistered = null;

    #[ORM\Column(name: 'is_rival_ai', type: Types::BOOLEAN, nullable: true)]
    private ?bool $isRivalAi = null;

    #[ORM\Column(name: 'neutral_algorithm_version', type: Types::STRING, length: 16, nullable: true)]
    private ?string $neutralAlgorithmVersion = null;

    #[ORM\Column(name: 'neutral_imported_at', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $neutralImportedAt = null;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $updatedAt;

    /** @var Collection<int, ReplayPlayer> */
    #[ORM\OneToMany(targetEntity: ReplayPlayer::class, mappedBy: 'replay', cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $players;

    public function __construct(string $extractorReplayId, string $sourceSha256)
    {
        $this->extractorReplayId = $extractorReplayId;
        $this->sourceSha256 = $sourceSha256;
        $this->players = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = $this->createdAt;
    }

    public function getId(): ?int { return $this->id; }
    public function getExtractorReplayId(): string { return $this->extractorReplayId; }
    public function getSourceSha256(): string { return $this->sourceSha256; }
    public function setSourceSha256(string $sourceSha256): self { $this->sourceSha256 = $sourceSha256; return $this->touch(); }
    public function getExtractorSchemaVersion(): ?string { return $this->extractorSchemaVersion; }
    public function setExtractorSchemaVersion(?string $version): self { $this->extractorSchemaVersion = $version; return $this->touch(); }
    public function isMetadataAvailable(): bool { return $this->metadataAvailable; }
    public function setMetadataAvailable(bool $metadataAvailable): self { $this->metadataAvailable = $metadataAvailable; return $this->touch(); }
    public function getUploadedAt(): ?\DateTimeImmutable { return $this->uploadedAt; }
    public function setUploadedAt(?\DateTimeImmutable $uploadedAt): self { $this->uploadedAt = $uploadedAt; return $this->touch(); }
    public function getUploadedAtRaw(): ?string { return $this->uploadedAtRaw; }
    public function setUploadedAtRaw(?string $uploadedAtRaw): self { $this->uploadedAtRaw = $uploadedAtRaw; return $this->touch(); }
    public function getUploadedAtUnit(): ?string { return $this->uploadedAtUnit; }
    public function setUploadedAtUnit(?string $uploadedAtUnit): self { $this->uploadedAtUnit = $uploadedAtUnit; return $this->touch(); }
    public function getCapturedAt(): ?\DateTimeImmutable { return $this->capturedAt; }
    public function setCapturedAt(?\DateTimeImmutable $capturedAt): self { $this->capturedAt = $capturedAt; return $this->touch(); }
    public function getBattleVersion(): ?int { return $this->battleVersion; }
    public function setBattleVersion(?int $battleVersion): self { $this->battleVersion = $battleVersion; return $this->touch(); }
    public function getLocalVersion(): ?int { return $this->localVersion; }
    public function setLocalVersion(?int $localVersion): self { $this->localVersion = $localVersion; return $this->touch(); }
    public function getRoundNum(): ?int { return $this->roundNum; }
    public function setRoundNum(?int $roundNum): self { $this->roundNum = $roundNum; return $this->touch(); }
    public function getStageId(): ?int { return $this->stageId; }
    public function setStageId(?int $stageId): self { $this->stageId = $stageId; return $this->touch(); }
    public function getBattleTypeRaw(): ?int { return $this->battleTypeRaw; }
    public function setBattleTypeRaw(?int $value): self { $this->battleTypeRaw = $value; return $this->touch(); }
    public function getGameModeRaw(): ?int { return $this->gameModeRaw; }
    public function setGameModeRaw(?int $value): self { $this->gameModeRaw = $value; return $this->touch(); }
    public function getBattleSubTypeRaw(): ?int { return $this->battleSubTypeRaw; }
    public function setBattleSubTypeRaw(?int $value): self { $this->battleSubTypeRaw = $value; return $this->touch(); }
    public function getReplayTabRaw(): ?int { return $this->replayTabRaw; }
    public function setReplayTabRaw(?int $value): self { $this->replayTabRaw = $value; return $this->touch(); }
    public function getBattleType(): ?string { return $this->battleType; }
    public function setBattleType(?string $value): self { $this->battleType = $value; return $this->touch(); }
    public function getGameMode(): ?string { return $this->gameMode; }
    public function setGameMode(?string $value): self { $this->gameMode = $value; return $this->touch(); }
    public function getReplayTab(): ?string { return $this->replayTab; }
    public function setReplayTab(?string $value): self { $this->replayTab = $value; return $this->touch(); }
    public function isRegistered(): ?bool { return $this->isRegistered; }
    public function setIsRegistered(?bool $value): self { $this->isRegistered = $value; return $this->touch(); }
    public function isRivalAi(): ?bool { return $this->isRivalAi; }
    public function setIsRivalAi(?bool $value): self { $this->isRivalAi = $value; return $this->touch(); }
    public function getNeutralAlgorithmVersion(): ?string { return $this->neutralAlgorithmVersion; }
    public function getNeutralImportedAt(): ?\DateTimeImmutable { return $this->neutralImportedAt; }

    public function markNeutralImported(?string $algorithmVersion): self
    {
        $this->neutralAlgorithmVersion = $algorithmVersion;
        $this->neutralImportedAt = new \DateTimeImmutable();

        return $this->touch();
    }

    /** @return Collection<int, ReplayPlayer> */
    public function getPlayers(): Collection { return $this->players; }

    public function getPlayerBySlot(int $slot): ?ReplayPlayer
    {
        foreach ($this->players as $player) {
            if ($player->getSlot() === $slot) {
                return $player;
            }
        }

        return null;
    }

    public function addPlayer(ReplayPlayer $player): self
    {
        if (!$this->players->contains($player)) {
            $this->players->add($player);
        }

        return $this;
    }

    private function touch(): self
    {
        $this->updatedAt = new \DateTimeImmutable();

        return $this;
    }
}
