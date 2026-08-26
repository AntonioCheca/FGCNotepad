<?php declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260826120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add frame-data import batches and typed supplemental overlay rows';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE sf6.frame_data_import_batch (id SERIAL NOT NULL, source_type VARCHAR(32) NOT NULL, label VARCHAR(160) NOT NULL, source_reference TEXT DEFAULT NULL, is_active BOOLEAN DEFAULT true NOT NULL, imported_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, retired_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_frame_data_import_batch_source_active ON sf6.frame_data_import_batch (source_type, is_active)');
        $this->addSql('CREATE TABLE sf6.frame_data_supplemental_value (id SERIAL NOT NULL, import_batch_id INT NOT NULL, move_id UUID NOT NULL, move_name TEXT DEFAULT NULL, startup SMALLINT DEFAULT NULL, active SMALLINT DEFAULT NULL, recovery SMALLINT DEFAULT NULL, total SMALLINT DEFAULT NULL, on_hit SMALLINT DEFAULT NULL, on_block SMALLINT DEFAULT NULL, on_punish_counter SMALLINT DEFAULT NULL, move_type TEXT DEFAULT NULL, cancels_to TEXT DEFAULT NULL, damage INT DEFAULT NULL, scaling TEXT DEFAULT NULL, scaling_start_percent SMALLINT DEFAULT NULL, scaling_immediate_percent SMALLINT DEFAULT NULL, scaling_minimum_percent SMALLINT DEFAULT NULL, scaling_combo_hits SMALLINT DEFAULT NULL, scaling_combo_extra_percent SMALLINT DEFAULT NULL, scaling_multiplier_percent SMALLINT DEFAULT NULL, scaling_parse_status VARCHAR(32) DEFAULT NULL, scaling_parse_note TEXT DEFAULT NULL, chip_damage INT DEFAULT NULL, attack_level TEXT DEFAULT NULL, on_hit_after_drive_rush SMALLINT DEFAULT NULL, on_block_after_drive_rush SMALLINT DEFAULT NULL, on_perfect_parry SMALLINT DEFAULT NULL, drive_damage_on_hit INT DEFAULT NULL, drive_damage_on_block INT DEFAULT NULL, drive_gain INT DEFAULT NULL, on_hit_self_super_meter_gain INT DEFAULT NULL, on_block_self_super_meter_gain INT DEFAULT NULL, on_hit_opponent_super_meter_gain INT DEFAULT NULL, on_block_opponent_super_meter_gain INT DEFAULT NULL, hit_confirm_specials_and_supers SMALLINT DEFAULT NULL, hit_confirm_target_combos SMALLINT DEFAULT NULL, juggle_limit SMALLINT DEFAULT NULL, juggle_increase SMALLINT DEFAULT NULL, juggle_start SMALLINT DEFAULT NULL, hitstun SMALLINT DEFAULT NULL, blockstun SMALLINT DEFAULT NULL, hitstop SMALLINT DEFAULT NULL, extra_information TEXT DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX uniq_frame_data_supplemental_batch_move ON sf6.frame_data_supplemental_value (import_batch_id, move_id)');
        $this->addSql('CREATE INDEX idx_frame_data_supplemental_batch ON sf6.frame_data_supplemental_value (import_batch_id)');
        $this->addSql('CREATE INDEX idx_frame_data_supplemental_move ON sf6.frame_data_supplemental_value (move_id)');
        $this->addSql('COMMENT ON COLUMN sf6.frame_data_supplemental_value.move_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE sf6.frame_data_supplemental_value ADD CONSTRAINT fk_frame_data_supplemental_batch FOREIGN KEY (import_batch_id) REFERENCES sf6.frame_data_import_batch (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.frame_data_supplemental_value ADD CONSTRAINT fk_frame_data_supplemental_move FOREIGN KEY (move_id) REFERENCES sf6.move (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE UNIQUE INDEX IF NOT EXISTS uniq_sf6_character_name ON sf6.character (name)');
        $this->addSql('CREATE UNIQUE INDEX IF NOT EXISTS uniq_sf6_move_character_numpad ON sf6.move (character_id, numpad_notation)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX IF EXISTS sf6.uniq_sf6_move_character_numpad');
        $this->addSql('DROP INDEX IF EXISTS sf6.uniq_sf6_character_name');
        $this->addSql('ALTER TABLE sf6.frame_data_supplemental_value DROP CONSTRAINT fk_frame_data_supplemental_move');
        $this->addSql('ALTER TABLE sf6.frame_data_supplemental_value DROP CONSTRAINT fk_frame_data_supplemental_batch');
        $this->addSql('DROP TABLE sf6.frame_data_supplemental_value');
        $this->addSql('DROP TABLE sf6.frame_data_import_batch');
    }
}
