<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20250305202230 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Change frame data schema';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.move DROP CONSTRAINT fk_cd33ad74ec3bc191');
        $this->addSql('CREATE TABLE sf6.frame_data (id UUID NOT NULL, startup SMALLINT DEFAULT NULL, active SMALLINT DEFAULT NULL, recovery SMALLINT DEFAULT NULL, total SMALLINT DEFAULT NULL, on_hit SMALLINT DEFAULT NULL, on_block SMALLINT DEFAULT NULL, on_punish_counter SMALLINT DEFAULT NULL, move_type TEXT NOT NULL, cancels_to TEXT DEFAULT NULL, damage INT DEFAULT NULL, scaling SMALLINT DEFAULT NULL, chip_damage INT DEFAULT NULL, attack_level TEXT DEFAULT NULL, on_hit_after_drive_rush SMALLINT DEFAULT NULL, on_block_after_drive_rush SMALLINT DEFAULT NULL, on_perfect_parry SMALLINT DEFAULT NULL, drive_damage_on_hit INT DEFAULT NULL, drive_damage_on_block INT DEFAULT NULL, drive_gain INT DEFAULT NULL, on_hit_self_super_meter_gain INT DEFAULT NULL, on_block_self_super_meter_gain INT DEFAULT NULL, on_hit_opponent_super_meter_gain INT DEFAULT NULL, on_block_opponent_super_meter_gain INT DEFAULT NULL, hit_confirm_specials_and_supers SMALLINT DEFAULT NULL, hit_confirm_target_combos SMALLINT DEFAULT NULL, juggle_limit SMALLINT DEFAULT NULL, juggle_increase SMALLINT DEFAULT NULL, juggle_start SMALLINT DEFAULT NULL, hitstun SMALLINT DEFAULT NULL, blockstun SMALLINT DEFAULT NULL, hitstop SMALLINT DEFAULT NULL, extra_information TEXT DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('COMMENT ON COLUMN sf6.frame_data.id IS \'(DC2Type:uuid)\'');
        $this->addSql('DROP TABLE frame_data');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.move DROP CONSTRAINT FK_CD33AD74EC3BC191');
        $this->addSql('CREATE TABLE frame_data (id UUID NOT NULL, startup SMALLINT DEFAULT NULL, active SMALLINT DEFAULT NULL, recovery SMALLINT DEFAULT NULL, total SMALLINT DEFAULT NULL, on_hit SMALLINT DEFAULT NULL, on_block SMALLINT DEFAULT NULL, on_punish_counter SMALLINT DEFAULT NULL, move_type TEXT NOT NULL, cancels_to TEXT DEFAULT NULL, damage INT DEFAULT NULL, scaling SMALLINT DEFAULT NULL, chip_damage INT DEFAULT NULL, attack_level TEXT DEFAULT NULL, on_hit_after_drive_rush SMALLINT DEFAULT NULL, on_block_after_drive_rush SMALLINT DEFAULT NULL, on_perfect_parry SMALLINT DEFAULT NULL, drive_damage_on_hit INT DEFAULT NULL, drive_damage_on_block INT DEFAULT NULL, drive_gain INT DEFAULT NULL, on_hit_self_super_meter_gain INT DEFAULT NULL, on_block_self_super_meter_gain INT DEFAULT NULL, on_hit_opponent_super_meter_gain INT DEFAULT NULL, on_block_opponent_super_meter_gain INT DEFAULT NULL, hit_confirm_specials_and_supers SMALLINT DEFAULT NULL, hit_confirm_target_combos SMALLINT DEFAULT NULL, juggle_limit SMALLINT DEFAULT NULL, juggle_increase SMALLINT DEFAULT NULL, juggle_start SMALLINT DEFAULT NULL, hitstun SMALLINT DEFAULT NULL, blockstun SMALLINT DEFAULT NULL, hitstop SMALLINT DEFAULT NULL, extra_information TEXT DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('COMMENT ON COLUMN frame_data.id IS \'(DC2Type:uuid)\'');
        $this->addSql('DROP TABLE sf6.frame_data');
    }
}
