<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260920120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add replay, replay_player and combo/Oki observation tables for replay metadata';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE sf6.replay (id SERIAL NOT NULL, extractor_replay_id VARCHAR(64) NOT NULL, source_sha256 VARCHAR(64) NOT NULL, extractor_schema_version VARCHAR(32) DEFAULT NULL, metadata_available BOOLEAN DEFAULT false NOT NULL, uploaded_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, uploaded_at_raw BIGINT DEFAULT NULL, uploaded_at_unit VARCHAR(8) DEFAULT NULL, captured_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, battle_version INT DEFAULT NULL, local_version INT DEFAULT NULL, round_num SMALLINT DEFAULT NULL, stage_id INT DEFAULT NULL, battle_type_raw INT DEFAULT NULL, game_mode_raw INT DEFAULT NULL, battle_sub_type_raw INT DEFAULT NULL, replay_tab_raw INT DEFAULT NULL, battle_type VARCHAR(64) DEFAULT NULL, game_mode VARCHAR(64) DEFAULT NULL, replay_tab VARCHAR(64) DEFAULT NULL, is_registered BOOLEAN DEFAULT NULL, is_rival_ai BOOLEAN DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX uniq_replay_extractor_replay_id ON sf6.replay (extractor_replay_id)');

        $this->addSql('CREATE TABLE sf6.replay_player (id SERIAL NOT NULL, replay_id INT NOT NULL, character_id UUID DEFAULT NULL, slot SMALLINT NOT NULL, character_id_raw INT DEFAULT NULL, character_name VARCHAR(64) DEFAULT NULL, cfn_name TEXT DEFAULT NULL, short_id BIGINT DEFAULT NULL, region VARCHAR(64) DEFAULT NULL, region_id INT DEFAULT NULL, rank_metric VARCHAR(8) DEFAULT NULL, rank_value INT DEFAULT NULL, is_master BOOLEAN DEFAULT NULL, is_legend BOOLEAN DEFAULT NULL, is_unranked BOOLEAN DEFAULT NULL, league_rank INT DEFAULT NULL, league_point INT DEFAULT NULL, league_tier VARCHAR(32) DEFAULT NULL, league_division SMALLINT DEFAULT NULL, master_rating INT DEFAULT NULL, master_rating_ranking INT DEFAULT NULL, master_league INT DEFAULT NULL, master_tier VARCHAR(32) DEFAULT NULL, mr_tier VARCHAR(32) DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX uniq_replay_player_replay_slot ON sf6.replay_player (replay_id, slot)');
        $this->addSql('CREATE INDEX idx_replay_player_short_id ON sf6.replay_player (short_id)');
        $this->addSql('CREATE INDEX IDX_REPLAY_PLAYER_CHARACTER ON sf6.replay_player (character_id)');
        $this->addSql("COMMENT ON COLUMN sf6.replay_player.character_id IS '(DC2Type:uuid)'");
        $this->addSql('ALTER TABLE sf6.replay_player ADD CONSTRAINT FK_REPLAY_PLAYER_REPLAY FOREIGN KEY (replay_id) REFERENCES sf6.replay (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.replay_player ADD CONSTRAINT FK_REPLAY_PLAYER_CHARACTER FOREIGN KEY (character_id) REFERENCES sf6.character (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE TABLE sf6.combo_observation (id SERIAL NOT NULL, combo_id INT NOT NULL, replay_id INT NOT NULL, performer_id INT DEFAULT NULL, occurrence_id VARCHAR(64) NOT NULL, damage INT DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX uniq_combo_observation_replay_occurrence ON sf6.combo_observation (replay_id, occurrence_id)');
        $this->addSql('CREATE INDEX idx_combo_observation_combo ON sf6.combo_observation (combo_id)');
        $this->addSql('CREATE INDEX idx_combo_observation_performer ON sf6.combo_observation (performer_id)');
        $this->addSql('ALTER TABLE sf6.combo_observation ADD CONSTRAINT FK_COMBO_OBSERVATION_COMBO FOREIGN KEY (combo_id) REFERENCES sf6.combo_sequence (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.combo_observation ADD CONSTRAINT FK_COMBO_OBSERVATION_REPLAY FOREIGN KEY (replay_id) REFERENCES sf6.replay (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.combo_observation ADD CONSTRAINT FK_COMBO_OBSERVATION_PERFORMER FOREIGN KEY (performer_id) REFERENCES sf6.replay_player (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE TABLE sf6.oki_setup_observation (id SERIAL NOT NULL, setup_id INT NOT NULL, replay_id INT NOT NULL, attacker_id INT DEFAULT NULL, defender_id INT DEFAULT NULL, occurrence_id VARCHAR(64) NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX uniq_oki_setup_observation_replay_occurrence ON sf6.oki_setup_observation (replay_id, occurrence_id)');
        $this->addSql('CREATE INDEX idx_oki_setup_observation_setup ON sf6.oki_setup_observation (setup_id)');
        $this->addSql('CREATE INDEX idx_oki_setup_observation_attacker ON sf6.oki_setup_observation (attacker_id)');
        $this->addSql('CREATE INDEX IDX_OKI_SETUP_OBSERVATION_DEFENDER ON sf6.oki_setup_observation (defender_id)');
        $this->addSql('ALTER TABLE sf6.oki_setup_observation ADD CONSTRAINT FK_OKI_SETUP_OBSERVATION_SETUP FOREIGN KEY (setup_id) REFERENCES sf6.oki_setup (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.oki_setup_observation ADD CONSTRAINT FK_OKI_SETUP_OBSERVATION_REPLAY FOREIGN KEY (replay_id) REFERENCES sf6.replay (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.oki_setup_observation ADD CONSTRAINT FK_OKI_SETUP_OBSERVATION_ATTACKER FOREIGN KEY (attacker_id) REFERENCES sf6.replay_player (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.oki_setup_observation ADD CONSTRAINT FK_OKI_SETUP_OBSERVATION_DEFENDER FOREIGN KEY (defender_id) REFERENCES sf6.replay_player (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE sf6.oki_setup_observation');
        $this->addSql('DROP TABLE sf6.combo_observation');
        $this->addSql('DROP TABLE sf6.replay_player');
        $this->addSql('DROP TABLE sf6.replay');
    }
}
