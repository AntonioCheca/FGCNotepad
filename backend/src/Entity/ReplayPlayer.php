<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * One player slot of a replay. Rank is a snapshot for the character played in this replay and is per
 * character, never a property of the person alone. Every field is nullable and stored as exported.
 * cfn_name and short_id identify real people: admin-only, never logged, never rendered as HTML.
 */
#[ORM\Entity]
#[ORM\Table(name: 'replay_player', schema: 'sf6')]
#[ORM\UniqueConstraint(name: 'uniq_replay_player_replay_slot', columns: ['replay_id', 'slot'])]
#[ORM\Index(name: 'idx_replay_player_short_id', columns: ['short_id'])]
class ReplayPlayer
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'players')]
    #[ORM\JoinColumn(name: 'replay_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Replay $replay;

    #[ORM\Column(type: Types::SMALLINT)]
    private int $slot;

    #[ORM\Column(name: 'character_id_raw', type: Types::INTEGER, nullable: true)]
    private ?int $characterIdRaw = null;

    #[ORM\Column(name: 'character_name', type: Types::STRING, length: 64, nullable: true)]
    private ?string $characterName = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'character_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?Character $character = null;

    #[ORM\Column(name: 'cfn_name', type: Types::TEXT, nullable: true)]
    private ?string $cfnName = null;

    #[ORM\Column(name: 'short_id', type: Types::BIGINT, nullable: true)]
    private ?string $shortId = null;

    /** classic / modern as exported; null when the export did not report it. */
    #[ORM\Column(name: 'control_scheme', type: Types::STRING, length: 16, nullable: true)]
    private ?string $controlScheme = null;

    #[ORM\Column(type: Types::STRING, length: 64, nullable: true)]
    private ?string $region = null;

    #[ORM\Column(name: 'region_id', type: Types::INTEGER, nullable: true)]
    private ?int $regionId = null;

    /** Raw CFN Home values (unvalidated); the region is derived from the Home category by the extractor. */
    #[ORM\Column(name: 'home_id', type: Types::INTEGER, nullable: true)]
    private ?int $homeId = null;

    #[ORM\Column(name: 'home_category_id', type: Types::INTEGER, nullable: true)]
    private ?int $homeCategoryId = null;

    #[ORM\Column(name: 'rank_metric', type: Types::STRING, length: 8, nullable: true)]
    private ?string $rankMetric = null;

    #[ORM\Column(name: 'rank_value', type: Types::INTEGER, nullable: true)]
    private ?int $rankValue = null;

    #[ORM\Column(name: 'is_master', type: Types::BOOLEAN, nullable: true)]
    private ?bool $isMaster = null;

    #[ORM\Column(name: 'is_legend', type: Types::BOOLEAN, nullable: true)]
    private ?bool $isLegend = null;

    #[ORM\Column(name: 'is_unranked', type: Types::BOOLEAN, nullable: true)]
    private ?bool $isUnranked = null;

    #[ORM\Column(name: 'league_rank', type: Types::INTEGER, nullable: true)]
    private ?int $leagueRank = null;

    #[ORM\Column(name: 'league_point', type: Types::INTEGER, nullable: true)]
    private ?int $leaguePoint = null;

    #[ORM\Column(name: 'league_tier', type: Types::STRING, length: 32, nullable: true)]
    private ?string $leagueTier = null;

    #[ORM\Column(name: 'league_division', type: Types::SMALLINT, nullable: true)]
    private ?int $leagueDivision = null;

    /** 0 is a sentinel for non-Master players; only meaningful when is_master is true or rank_metric is MR. */
    #[ORM\Column(name: 'master_rating', type: Types::INTEGER, nullable: true)]
    private ?int $masterRating = null;

    #[ORM\Column(name: 'master_rating_ranking', type: Types::INTEGER, nullable: true)]
    private ?int $masterRatingRanking = null;

    #[ORM\Column(name: 'master_league', type: Types::INTEGER, nullable: true)]
    private ?int $masterLeague = null;

    #[ORM\Column(name: 'master_tier', type: Types::STRING, length: 32, nullable: true)]
    private ?string $masterTier = null;

    #[ORM\Column(name: 'mr_tier', type: Types::STRING, length: 32, nullable: true)]
    private ?string $mrTier = null;

    public function __construct(Replay $replay, int $slot)
    {
        $this->replay = $replay;
        $this->slot = $slot;
        $replay->addPlayer($this);
    }

    public function getId(): ?int { return $this->id; }
    public function getReplay(): Replay { return $this->replay; }
    public function getSlot(): int { return $this->slot; }
    public function getCharacterIdRaw(): ?int { return $this->characterIdRaw; }
    public function setCharacterIdRaw(?int $value): self { $this->characterIdRaw = $value; return $this; }
    public function getCharacterName(): ?string { return $this->characterName; }
    public function setCharacterName(?string $value): self { $this->characterName = $value; return $this; }
    public function getCharacter(): ?Character { return $this->character; }
    public function setCharacter(?Character $value): self { $this->character = $value; return $this; }
    public function getCfnName(): ?string { return $this->cfnName; }
    public function setCfnName(?string $value): self { $this->cfnName = $value; return $this; }
    public function getShortId(): ?string { return $this->shortId; }
    public function setShortId(?string $value): self { $this->shortId = $value; return $this; }
    public function getControlScheme(): ?string { return $this->controlScheme; }
    public function setControlScheme(?string $value): self { $this->controlScheme = $value; return $this; }
    public function getRegion(): ?string { return $this->region; }
    public function setRegion(?string $value): self { $this->region = $value; return $this; }
    public function getRegionId(): ?int { return $this->regionId; }
    public function setRegionId(?int $value): self { $this->regionId = $value; return $this; }
    public function getHomeId(): ?int { return $this->homeId; }
    public function setHomeId(?int $value): self { $this->homeId = $value; return $this; }
    public function getHomeCategoryId(): ?int { return $this->homeCategoryId; }
    public function setHomeCategoryId(?int $value): self { $this->homeCategoryId = $value; return $this; }
    public function getRankMetric(): ?string { return $this->rankMetric; }
    public function setRankMetric(?string $value): self { $this->rankMetric = $value; return $this; }
    public function getRankValue(): ?int { return $this->rankValue; }
    public function setRankValue(?int $value): self { $this->rankValue = $value; return $this; }
    public function isMaster(): ?bool { return $this->isMaster; }
    public function setIsMaster(?bool $value): self { $this->isMaster = $value; return $this; }
    public function isLegend(): ?bool { return $this->isLegend; }
    public function setIsLegend(?bool $value): self { $this->isLegend = $value; return $this; }
    public function isUnranked(): ?bool { return $this->isUnranked; }
    public function setIsUnranked(?bool $value): self { $this->isUnranked = $value; return $this; }
    public function getLeagueRank(): ?int { return $this->leagueRank; }
    public function setLeagueRank(?int $value): self { $this->leagueRank = $value; return $this; }
    public function getLeaguePoint(): ?int { return $this->leaguePoint; }
    public function setLeaguePoint(?int $value): self { $this->leaguePoint = $value; return $this; }
    public function getLeagueTier(): ?string { return $this->leagueTier; }
    public function setLeagueTier(?string $value): self { $this->leagueTier = $value; return $this; }
    public function getLeagueDivision(): ?int { return $this->leagueDivision; }
    public function setLeagueDivision(?int $value): self { $this->leagueDivision = $value; return $this; }
    public function getMasterRating(): ?int { return $this->masterRating; }
    public function setMasterRating(?int $value): self { $this->masterRating = $value; return $this; }
    public function getMasterRatingRanking(): ?int { return $this->masterRatingRanking; }
    public function setMasterRatingRanking(?int $value): self { $this->masterRatingRanking = $value; return $this; }
    public function getMasterLeague(): ?int { return $this->masterLeague; }
    public function setMasterLeague(?int $value): self { $this->masterLeague = $value; return $this; }
    public function getMasterTier(): ?string { return $this->masterTier; }
    public function setMasterTier(?string $value): self { $this->masterTier = $value; return $this; }
    public function getMrTier(): ?string { return $this->mrTier; }
    public function setMrTier(?string $value): self { $this->mrTier = $value; return $this; }
}
