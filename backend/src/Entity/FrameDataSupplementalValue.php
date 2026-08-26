<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\FrameDataSupplementalValueRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: FrameDataSupplementalValueRepository::class)]
#[ORM\Table(name: 'frame_data_supplemental_value', schema: 'sf6')]
#[ORM\UniqueConstraint(name: 'uniq_frame_data_supplemental_batch_move', columns: ['import_batch_id', 'move_id'])]
class FrameDataSupplementalValue
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'import_batch_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private FrameDataImportBatch $importBatch;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'move_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Move $move;

    #[ORM\Column(name: 'move_name', type: Types::TEXT, nullable: true)]
    private ?string $moveName = null;

    #[ORM\Column(type: Types::SMALLINT, nullable: true)] private ?int $startup = null;
    #[ORM\Column(type: Types::SMALLINT, nullable: true)] private ?int $active = null;
    #[ORM\Column(type: Types::SMALLINT, nullable: true)] private ?int $recovery = null;
    #[ORM\Column(type: Types::SMALLINT, nullable: true)] private ?int $total = null;
    #[ORM\Column(name: 'on_hit', type: Types::SMALLINT, nullable: true)] private ?int $onHit = null;
    #[ORM\Column(name: 'on_block', type: Types::SMALLINT, nullable: true)] private ?int $onBlock = null;
    #[ORM\Column(name: 'on_punish_counter', type: Types::SMALLINT, nullable: true)] private ?int $onPunishCounter = null;
    #[ORM\Column(name: 'move_type', type: Types::TEXT, nullable: true)] private ?string $moveType = null;
    #[ORM\Column(name: 'cancels_to', type: Types::TEXT, nullable: true)] private ?string $cancelsTo = null;
    #[ORM\Column(nullable: true)] private ?int $damage = null;
    #[ORM\Column(type: Types::TEXT, nullable: true)] private ?string $scaling = null;
    #[ORM\Column(name: 'scaling_start_percent', type: Types::SMALLINT, nullable: true)] private ?int $scalingStartPercent = null;
    #[ORM\Column(name: 'scaling_immediate_percent', type: Types::SMALLINT, nullable: true)] private ?int $scalingImmediatePercent = null;
    #[ORM\Column(name: 'scaling_minimum_percent', type: Types::SMALLINT, nullable: true)] private ?int $scalingMinimumPercent = null;
    #[ORM\Column(name: 'scaling_combo_hits', type: Types::SMALLINT, nullable: true)] private ?int $scalingComboHits = null;
    #[ORM\Column(name: 'scaling_combo_extra_percent', type: Types::SMALLINT, nullable: true)] private ?int $scalingComboExtraPercent = null;
    #[ORM\Column(name: 'scaling_multiplier_percent', type: Types::SMALLINT, nullable: true)] private ?int $scalingMultiplierPercent = null;
    #[ORM\Column(name: 'scaling_parse_status', type: Types::STRING, length: 32, nullable: true)] private ?string $scalingParseStatus = null;
    #[ORM\Column(name: 'scaling_parse_note', type: Types::TEXT, nullable: true)] private ?string $scalingParseNote = null;
    #[ORM\Column(name: 'chip_damage', nullable: true)] private ?int $chipDamage = null;
    #[ORM\Column(name: 'attack_level', type: Types::TEXT, nullable: true)] private ?string $attackLevel = null;
    #[ORM\Column(name: 'on_hit_after_drive_rush', type: Types::SMALLINT, nullable: true)] private ?int $onHitAfterDriveRush = null;
    #[ORM\Column(name: 'on_block_after_drive_rush', type: Types::SMALLINT, nullable: true)] private ?int $onBlockAfterDriveRush = null;
    #[ORM\Column(name: 'on_perfect_parry', type: Types::SMALLINT, nullable: true)] private ?int $onPerfectParry = null;
    #[ORM\Column(name: 'drive_damage_on_hit', nullable: true)] private ?int $driveDamageOnHit = null;
    #[ORM\Column(name: 'drive_damage_on_block', nullable: true)] private ?int $driveDamageOnBlock = null;
    #[ORM\Column(name: 'drive_gain', nullable: true)] private ?int $driveGain = null;
    #[ORM\Column(name: 'on_hit_self_super_meter_gain', nullable: true)] private ?int $onHitSelfSuperMeterGain = null;
    #[ORM\Column(name: 'on_block_self_super_meter_gain', nullable: true)] private ?int $onBlockSelfSuperMeterGain = null;
    #[ORM\Column(name: 'on_hit_opponent_super_meter_gain', nullable: true)] private ?int $onHitOpponentSuperMeterGain = null;
    #[ORM\Column(name: 'on_block_opponent_super_meter_gain', nullable: true)] private ?int $onBlockOpponentSuperMeterGain = null;
    #[ORM\Column(name: 'hit_confirm_specials_and_supers', type: Types::SMALLINT, nullable: true)] private ?int $hitConfirmSpecialsAndSupers = null;
    #[ORM\Column(name: 'hit_confirm_target_combos', type: Types::SMALLINT, nullable: true)] private ?int $hitConfirmTargetCombos = null;
    #[ORM\Column(name: 'juggle_limit', type: Types::SMALLINT, nullable: true)] private ?int $juggleLimit = null;
    #[ORM\Column(name: 'juggle_increase', type: Types::SMALLINT, nullable: true)] private ?int $juggleIncrease = null;
    #[ORM\Column(name: 'juggle_start', type: Types::SMALLINT, nullable: true)] private ?int $juggleStart = null;
    #[ORM\Column(type: Types::SMALLINT, nullable: true)] private ?int $hitstun = null;
    #[ORM\Column(type: Types::SMALLINT, nullable: true)] private ?int $blockstun = null;
    #[ORM\Column(type: Types::SMALLINT, nullable: true)] private ?int $hitstop = null;
    #[ORM\Column(name: 'extra_information', type: Types::TEXT, nullable: true)] private ?string $extraInformation = null;

    public function getId(): ?int { return $this->id; }
    public function getImportBatch(): FrameDataImportBatch { return $this->importBatch; }
    public function setImportBatch(FrameDataImportBatch $importBatch): static { $this->importBatch = $importBatch; return $this; }
    public function getMove(): Move { return $this->move; }
    public function setMove(Move $move): static { $this->move = $move; return $this; }
    public function getMoveName(): ?string { return $this->moveName; }
    public function setMoveName(?string $moveName): static { $this->moveName = null === $moveName || '' === trim($moveName) ? null : trim($moveName); return $this; }

    /** @return array<string, mixed> */
    public function toOverlayMap(): array
    {
        $map = [];
        foreach ($this->getImportableColumns() as $columnName) {
            $value = $this->{$columnName};
            if (null !== $value) {
                $map[$columnName] = $value;
            }
        }

        return $map;
    }

    /** @return list<string> */
    public static function getImportableColumns(): array
    {
        return ['startup', 'active', 'recovery', 'total', 'onHit', 'onBlock', 'onPunishCounter', 'moveType', 'cancelsTo', 'damage', 'scaling', 'scalingStartPercent', 'scalingImmediatePercent', 'scalingMinimumPercent', 'scalingComboHits', 'scalingComboExtraPercent', 'scalingMultiplierPercent', 'scalingParseStatus', 'scalingParseNote', 'chipDamage', 'attackLevel', 'onHitAfterDriveRush', 'onBlockAfterDriveRush', 'onPerfectParry', 'driveDamageOnHit', 'driveDamageOnBlock', 'driveGain', 'onHitSelfSuperMeterGain', 'onBlockSelfSuperMeterGain', 'onHitOpponentSuperMeterGain', 'onBlockOpponentSuperMeterGain', 'hitConfirmSpecialsAndSupers', 'hitConfirmTargetCombos', 'juggleLimit', 'juggleIncrease', 'juggleStart', 'hitstun', 'blockstun', 'hitstop', 'extraInformation'];
    }

    public function setValue(string $columnName, mixed $value): void
    {
        if (!in_array($columnName, self::getImportableColumns(), true)) {
            throw new \InvalidArgumentException(sprintf('Unsupported supplemental column "%s".', $columnName));
        }

        $this->{$columnName} = $value;
    }
}
