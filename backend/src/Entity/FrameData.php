<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\FrameDataRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Table(name: "frame_data", schema: "sf6")]
#[ORM\Entity(repositoryClass: FrameDataRepository::class)]
class FrameData
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    #[ORM\Column(type: Types::SMALLINT, nullable: true)]
    private ?int $startup = null;

    #[ORM\Column(type: Types::SMALLINT, nullable: true)]
    private ?int $active = null;

    #[ORM\Column(type: Types::SMALLINT, nullable: true)]
    private ?int $recovery = null;

    #[ORM\Column(type: Types::SMALLINT, nullable: true)]
    private ?int $total = null;

    #[ORM\Column(type: Types::SMALLINT, nullable: true)]
    private ?int $onHit = null;

    #[ORM\Column(type: Types::SMALLINT, nullable: true)]
    private ?int $onBlock = null;

    #[ORM\Column(type: Types::SMALLINT, nullable: true)]
    private ?int $onPunishCounter = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $moveType = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $cancelsTo = null;

    #[ORM\Column(nullable: true)]
    private ?int $damage = null;

    #[ORM\Column(type: Types::SMALLINT, nullable: true)]
    private ?int $scaling = null;

    #[ORM\Column(nullable: true)]
    private ?int $chipDamage = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $attackLevel = null;

    #[ORM\Column(type: Types::SMALLINT, nullable: true)]
    private ?int $onHitAfterDriveRush = null;

    #[ORM\Column(type: Types::SMALLINT, nullable: true)]
    private ?int $onBlockAfterDriveRush = null;

    #[ORM\Column(type: Types::SMALLINT, nullable: true)]
    private ?int $onPerfectParry = null;

    #[ORM\Column(nullable: true)]
    private ?int $driveDamageOnHit = null;

    #[ORM\Column(nullable: true)]
    private ?int $driveDamageOnBlock = null;

    #[ORM\Column(nullable: true)]
    private ?int $driveGain = null;

    #[ORM\Column(nullable: true)]
    private ?int $onHitSelfSuperMeterGain = null;

    #[ORM\Column(nullable: true)]
    private ?int $onBlockSelfSuperMeterGain = null;

    #[ORM\Column(nullable: true)]
    private ?int $onHitOpponentSuperMeterGain = null;

    #[ORM\Column(nullable: true)]
    private ?int $onBlockOpponentSuperMeterGain = null;

    #[ORM\Column(type: Types::SMALLINT, nullable: true)]
    private ?int $hitConfirmSpecialsAndSupers = null;

    #[ORM\Column(type: Types::SMALLINT, nullable: true)]
    private ?int $hitConfirmTargetCombos = null;

    #[ORM\Column(type: Types::SMALLINT, nullable: true)]
    private ?int $juggleLimit = null;

    #[ORM\Column(type: Types::SMALLINT, nullable: true)]
    private ?int $juggleIncrease = null;

    #[ORM\Column(type: Types::SMALLINT, nullable: true)]
    private ?int $juggleStart = null;

    #[ORM\Column(type: Types::SMALLINT, nullable: true)]
    private ?int $hitstun = null;

    #[ORM\Column(type: Types::SMALLINT, nullable: true)]
    private ?int $blockstun = null;

    #[ORM\Column(type: Types::SMALLINT, nullable: true)]
    private ?int $hitstop = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $extraInformation = null;

    #[ORM\OneToOne(mappedBy: 'frameData', cascade: ['persist', 'remove'])]
    private ?Move $move = null;

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getStartup(): ?int
    {
        return $this->startup;
    }

    public function setStartup(int $startup): static
    {
        $this->startup = $startup;

        return $this;
    }

    public function getActive(): ?int
    {
        return $this->active;
    }

    public function setActive(int $active): static
    {
        $this->active = $active;

        return $this;
    }

    public function getRecovery(): ?int
    {
        return $this->recovery;
    }

    public function setRecovery(int $recovery): static
    {
        $this->recovery = $recovery;

        return $this;
    }

    public function getTotal(): ?int
    {
        return $this->total;
    }

    public function setTotal(int $total): static
    {
        $this->total = $total;

        return $this;
    }

    public function getOnHit(): ?int
    {
        return $this->onHit;
    }

    public function setOnHit(int $onHit): static
    {
        $this->onHit = $onHit;

        return $this;
    }

    public function getOnBlock(): ?int
    {
        return $this->onBlock;
    }

    public function setOnBlock(int $onBlock): static
    {
        $this->onBlock = $onBlock;

        return $this;
    }

    public function getOnPunishCounter(): ?int
    {
        return $this->onPunishCounter;
    }

    public function setOnPunishCounter(int $onPunishCounter): static
    {
        $this->onPunishCounter = $onPunishCounter;

        return $this;
    }

    public function getMoveType(): ?string
    {
        return $this->moveType;
    }

    public function setMoveType(string $moveType): static
    {
        $this->moveType = $moveType;

        return $this;
    }

    public function getCancelsTo(): ?string
    {
        return $this->cancelsTo;
    }

    public function setCancelsTo(string $cancelsTo): static
    {
        $this->cancelsTo = $cancelsTo;

        return $this;
    }

    public function getDamage(): ?int
    {
        return $this->damage;
    }

    public function setDamage(int $damage): static
    {
        $this->damage = $damage;

        return $this;
    }

    public function getScaling(): ?int
    {
        return $this->scaling;
    }

    public function setScaling(int $scaling): static
    {
        $this->scaling = $scaling;

        return $this;
    }

    public function getChipDamage(): ?int
    {
        return $this->chipDamage;
    }

    public function setChipDamage(int $chipDamage): static
    {
        $this->chipDamage = $chipDamage;

        return $this;
    }

    public function getAttackLevel(): ?string
    {
        return $this->attackLevel;
    }

    public function setAttackLevel(string $attackLevel): static
    {
        $this->attackLevel = $attackLevel;

        return $this;
    }

    public function getOnHitAfterDriveRush(): ?int
    {
        return $this->onHitAfterDriveRush;
    }

    public function setOnHitAfterDriveRush(int $onHitAfterDriveRush): static
    {
        $this->onHitAfterDriveRush = $onHitAfterDriveRush;

        return $this;
    }

    public function getOnBlockAfterDriveRush(): ?int
    {
        return $this->onBlockAfterDriveRush;
    }

    public function setOnBlockAfterDriveRush(int $onBlockAfterDriveRush): static
    {
        $this->onBlockAfterDriveRush = $onBlockAfterDriveRush;

        return $this;
    }

    public function getOnPerfectParry(): ?int
    {
        return $this->onPerfectParry;
    }

    public function setOnPerfectParry(int $onPerfectParry): static
    {
        $this->onPerfectParry = $onPerfectParry;

        return $this;
    }

    public function getDriveDamageOnHit(): ?int
    {
        return $this->driveDamageOnHit;
    }

    public function setDriveDamageOnHit(int $driveDamageOnHit): static
    {
        $this->driveDamageOnHit = $driveDamageOnHit;

        return $this;
    }

    public function getDriveDamageOnBlock(): ?int
    {
        return $this->driveDamageOnBlock;
    }

    public function setDriveDamageOnBlock(int $driveDamageOnBlock): static
    {
        $this->driveDamageOnBlock = $driveDamageOnBlock;

        return $this;
    }

    public function getDriveGain(): ?int
    {
        return $this->driveGain;
    }

    public function setDriveGain(int $driveGain): static
    {
        $this->driveGain = $driveGain;

        return $this;
    }

    public function getOnHitSelfSuperMeterGain(): ?int
    {
        return $this->onHitSelfSuperMeterGain;
    }

    public function setOnHitSelfSuperMeterGain(int $onHitSelfSuperMeterGain): static
    {
        $this->onHitSelfSuperMeterGain = $onHitSelfSuperMeterGain;

        return $this;
    }

    public function getOnBlockSelfSuperMeterGain(): ?int
    {
        return $this->onBlockSelfSuperMeterGain;
    }

    public function setOnBlockSelfSuperMeterGain(int $onBlockSelfSuperMeterGain): static
    {
        $this->onBlockSelfSuperMeterGain = $onBlockSelfSuperMeterGain;

        return $this;
    }

    public function getOnHitOpponentSuperMeterGain(): ?int
    {
        return $this->onHitOpponentSuperMeterGain;
    }

    public function setOnHitOpponentSuperMeterGain(int $onHitOpponentSuperMeterGain): static
    {
        $this->onHitOpponentSuperMeterGain = $onHitOpponentSuperMeterGain;

        return $this;
    }

    public function getOnBlockOpponentSuperMeterGain(): ?int
    {
        return $this->onBlockOpponentSuperMeterGain;
    }

    public function setOnBlockOpponentSuperMeterGain(int $onBlockOpponentSuperMeterGain): static
    {
        $this->onBlockOpponentSuperMeterGain = $onBlockOpponentSuperMeterGain;

        return $this;
    }

    public function getHitConfirmSpecialsAndSupers(): ?int
    {
        return $this->hitConfirmSpecialsAndSupers;
    }

    public function setHitConfirmSpecialsAndSupers(int $hitConfirmSpecialsAndSupers): static
    {
        $this->hitConfirmSpecialsAndSupers = $hitConfirmSpecialsAndSupers;

        return $this;
    }

    public function getHitConfirmTargetCombos(): ?int
    {
        return $this->hitConfirmTargetCombos;
    }

    public function setHitConfirmTargetCombos(?int $hitConfirmTargetCombos): static
    {
        $this->hitConfirmTargetCombos = $hitConfirmTargetCombos;

        return $this;
    }

    public function getJuggleLimit(): ?int
    {
        return $this->juggleLimit;
    }

    public function setJuggleLimit(?int $juggleLimit): static
    {
        $this->juggleLimit = $juggleLimit;

        return $this;
    }

    public function getJuggleIncrease(): ?int
    {
        return $this->juggleIncrease;
    }

    public function setJuggleIncrease(?int $juggleIncrease): static
    {
        $this->juggleIncrease = $juggleIncrease;

        return $this;
    }

    public function getJuggleStart(): ?int
    {
        return $this->juggleStart;
    }

    public function setJuggleStart(?int $juggleStart): static
    {
        $this->juggleStart = $juggleStart;

        return $this;
    }

    public function getHitstun(): ?int
    {
        return $this->hitstun;
    }

    public function setHitstun(?int $hitstun): static
    {
        $this->hitstun = $hitstun;

        return $this;
    }

    public function getBlockstun(): ?int
    {
        return $this->blockstun;
    }

    public function setBlockstun(?int $blockstun): static
    {
        $this->blockstun = $blockstun;

        return $this;
    }

    public function getHitstop(): ?int
    {
        return $this->hitstop;
    }

    public function setHitstop(?int $hitstop): static
    {
        $this->hitstop = $hitstop;

        return $this;
    }

    public function getExtraInformation(): ?string
    {
        return $this->extraInformation;
    }

    public function setExtraInformation(?string $extraInformation): static
    {
        $this->extraInformation = $extraInformation;

        return $this;
    }

    public function getMove(): ?Move
    {
        return $this->move;
    }

    public function setMove(?Move $move): static
    {
        // unset the owning side of the relation if necessary
        if ($move === null && $this->move !== null) {
            $this->move->setFrameData(null);
        }

        // set the owning side of the relation if necessary
        if ($move !== null && $move->getFrameData() !== $this) {
            $move->setFrameData($this);
        }

        $this->move = $move;

        return $this;
    }

    public function getSummaryAsArray(): array
    {
        $dataAsArray = [];
        $dataAsArray['startup'] = $this->startup;
        $dataAsArray['active'] = $this->active;
        $dataAsArray['recovery'] = $this->recovery;
        $dataAsArray['on_hit'] = $this->onHit;
        $dataAsArray['on_block'] = $this->onBlock;

        return $dataAsArray;
    }

    public function getFullDataAsArray(): array
    {
        $dataAsArray = $this->getSummaryAsArray();
        $dataAsArray['total'] = $this->total;
        $dataAsArray['on_punish_counter'] = $this->onPunishCounter;
        $dataAsArray['move_type'] = $this->moveType;
        $dataAsArray['cancels_to'] = $this->cancelsTo;
        $dataAsArray['damage'] = $this->damage;
        $dataAsArray['scaling'] = $this->scaling;
        $dataAsArray['chip_damage'] = $this->chipDamage;
        $dataAsArray['attack_level'] = $this->attackLevel;
        $dataAsArray['on_hit_after_drive_rush'] = $this->onHitAfterDriveRush;
        $dataAsArray['on_block_after_drive_rush'] = $this->onBlockAfterDriveRush;
        $dataAsArray['on_perfect_parry'] = $this->onPerfectParry;
        $dataAsArray['drive_damage_on_hit'] = $this->driveDamageOnHit;
        $dataAsArray['drive_damage_on_block'] = $this->driveDamageOnBlock;
        $dataAsArray['drive_gain'] = $this->driveGain;
        $dataAsArray['on_hit_self_super_meter_gain'] = $this->onHitSelfSuperMeterGain;
        $dataAsArray['on_block_self_super_meter_gain'] = $this->onBlockSelfSuperMeterGain;
        $dataAsArray['hit_confirm_specials_and_supers'] = $this->hitConfirmSpecialsAndSupers;
        $dataAsArray['hit_confirm_target_combos'] = $this->hitConfirmTargetCombos;
        $dataAsArray['juggle_limit'] = $this->juggleLimit;
        $dataAsArray['juggle_increase'] = $this->juggleIncrease;
        $dataAsArray['juggle_start'] = $this->juggleStart;
        $dataAsArray['hitstun'] = $this->hitstun;
        $dataAsArray['blockstun'] = $this->blockstun;
        $dataAsArray['hitstop'] = $this->hitstop;

        return $dataAsArray;
    }
}
