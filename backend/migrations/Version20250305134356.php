<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250305134356 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Added character and frame data entities';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE sf6.character (id UUID NOT NULL, name TEXT NOT NULL, PRIMARY KEY(id))');
        $this->addSql('COMMENT ON COLUMN sf6.character.id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE frame_data (id UUID NOT NULL, startup SMALLINT DEFAULT NULL, active SMALLINT DEFAULT NULL, recovery SMALLINT DEFAULT NULL, total SMALLINT DEFAULT NULL, on_hit SMALLINT DEFAULT NULL, on_block SMALLINT DEFAULT NULL, on_punish_counter SMALLINT DEFAULT NULL, move_type TEXT NOT NULL, cancels_to TEXT DEFAULT NULL, damage INT DEFAULT NULL, scaling SMALLINT DEFAULT NULL, chip_damage INT DEFAULT NULL, attack_level TEXT DEFAULT NULL, on_hit_after_drive_rush SMALLINT DEFAULT NULL, on_block_after_drive_rush SMALLINT DEFAULT NULL, on_perfect_parry SMALLINT DEFAULT NULL, drive_damage_on_hit INT DEFAULT NULL, drive_damage_on_block INT DEFAULT NULL, drive_gain INT DEFAULT NULL, on_hit_self_super_meter_gain INT DEFAULT NULL, on_block_self_super_meter_gain INT DEFAULT NULL, on_hit_opponent_super_meter_gain INT DEFAULT NULL, on_block_opponent_super_meter_gain INT DEFAULT NULL, hit_confirm_specials_and_supers SMALLINT DEFAULT NULL, hit_confirm_target_combos SMALLINT DEFAULT NULL, juggle_limit SMALLINT DEFAULT NULL, juggle_increase SMALLINT DEFAULT NULL, juggle_start SMALLINT DEFAULT NULL, hitstun SMALLINT DEFAULT NULL, blockstun SMALLINT DEFAULT NULL, hitstop SMALLINT DEFAULT NULL, extra_information TEXT DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('COMMENT ON COLUMN frame_data.id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE sf6.move ADD character_id UUID NOT NULL');
        $this->addSql('ALTER TABLE sf6.move ADD frame_data_id UUID DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.move DROP startup');
        $this->addSql('COMMENT ON COLUMN sf6.move.character_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN sf6.move.frame_data_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE sf6.move ADD CONSTRAINT FK_CD33AD741136BE75 FOREIGN KEY (character_id) REFERENCES sf6.character (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.move ADD CONSTRAINT FK_CD33AD74EC3BC191 FOREIGN KEY (frame_data_id) REFERENCES frame_data (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE INDEX IDX_CD33AD741136BE75 ON sf6.move (character_id)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_CD33AD74EC3BC191 ON sf6.move (frame_data_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE sf6.move DROP CONSTRAINT FK_CD33AD741136BE75');
        $this->addSql('ALTER TABLE sf6.move DROP CONSTRAINT FK_CD33AD74EC3BC191');
        $this->addSql('DROP TABLE sf6.character');
        $this->addSql('DROP TABLE frame_data');
        $this->addSql('DROP INDEX IDX_CD33AD741136BE75');
        $this->addSql('DROP INDEX UNIQ_CD33AD74EC3BC191');
        $this->addSql('ALTER TABLE sf6.move ADD startup INT NOT NULL');
        $this->addSql('ALTER TABLE sf6.move DROP character_id');
        $this->addSql('ALTER TABLE sf6.move DROP frame_data_id');
    }
}
