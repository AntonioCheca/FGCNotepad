<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260926100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Neutral stats: neutral observations with frame state and resources, replay neutral provenance, player control scheme and FAT move names';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.frame_data ADD move_name VARCHAR(128) DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.replay ADD neutral_algorithm_version VARCHAR(16) DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.replay ADD neutral_imported_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql("COMMENT ON COLUMN sf6.replay.neutral_imported_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql('ALTER TABLE sf6.replay_player ADD control_scheme VARCHAR(16) DEFAULT NULL');

        $this->addSql('CREATE TABLE sf6.neutral_observation (id SERIAL NOT NULL, replay_id INT NOT NULL, actor_player_id INT NOT NULL, opponent_player_id INT NOT NULL, character_id UUID NOT NULL, opponent_character_id UUID DEFAULT NULL, move_id UUID NOT NULL, source_observation_id VARCHAR(96) NOT NULL, action_id INT DEFAULT NULL, route VARCHAR(16) NOT NULL, spacing DOUBLE PRECISION NOT NULL, catalogue_category VARCHAR(64) DEFAULT NULL, entered_from VARCHAR(32) DEFAULT NULL, round_number SMALLINT DEFAULT NULL, round_timer SMALLINT DEFAULT NULL, replay_frame INT DEFAULT NULL, source_index INT DEFAULT NULL, actor_health INT DEFAULT NULL, actor_drive INT DEFAULT NULL, actor_super INT DEFAULT NULL, actor_install_active BOOLEAN DEFAULT NULL, actor_install_remaining INT DEFAULT NULL, opponent_health INT DEFAULT NULL, opponent_drive INT DEFAULT NULL, opponent_super INT DEFAULT NULL, opponent_install_active BOOLEAN DEFAULT NULL, opponent_install_remaining INT DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_B7FF7D4D186CE3E1 ON sf6.neutral_observation (replay_id)');
        $this->addSql('CREATE INDEX IDX_B7FF7D4D1136BE75 ON sf6.neutral_observation (character_id)');
        $this->addSql('CREATE INDEX IDX_B7FF7D4DA1CEB025 ON sf6.neutral_observation (opponent_character_id)');
        $this->addSql('CREATE INDEX idx_neutral_observation_character_move ON sf6.neutral_observation (character_id, move_id)');
        $this->addSql('CREATE INDEX idx_neutral_observation_character_opponent ON sf6.neutral_observation (character_id, opponent_character_id)');
        $this->addSql('CREATE INDEX idx_neutral_observation_actor ON sf6.neutral_observation (actor_player_id)');
        $this->addSql('CREATE INDEX idx_neutral_observation_opponent_player ON sf6.neutral_observation (opponent_player_id)');
        $this->addSql('CREATE INDEX idx_neutral_observation_move ON sf6.neutral_observation (move_id)');
        $this->addSql('CREATE UNIQUE INDEX uniq_neutral_observation_replay_source ON sf6.neutral_observation (replay_id, source_observation_id)');
        $this->addSql("COMMENT ON COLUMN sf6.neutral_observation.character_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN sf6.neutral_observation.opponent_character_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN sf6.neutral_observation.move_id IS '(DC2Type:uuid)'");
        $this->addSql('ALTER TABLE sf6.neutral_observation ADD CONSTRAINT FK_B7FF7D4D186CE3E1 FOREIGN KEY (replay_id) REFERENCES sf6.replay (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.neutral_observation ADD CONSTRAINT FK_B7FF7D4D6D9F05F3 FOREIGN KEY (actor_player_id) REFERENCES sf6.replay_player (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.neutral_observation ADD CONSTRAINT FK_B7FF7D4D37394956 FOREIGN KEY (opponent_player_id) REFERENCES sf6.replay_player (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.neutral_observation ADD CONSTRAINT FK_B7FF7D4D1136BE75 FOREIGN KEY (character_id) REFERENCES sf6.character (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.neutral_observation ADD CONSTRAINT FK_B7FF7D4DA1CEB025 FOREIGN KEY (opponent_character_id) REFERENCES sf6.character (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.neutral_observation ADD CONSTRAINT FK_B7FF7D4D6DC541A8 FOREIGN KEY (move_id) REFERENCES sf6.move (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE TABLE sf6.neutral_observation_resource (id SERIAL NOT NULL, observation_id INT NOT NULL, character_object_id INT DEFAULT NULL, side VARCHAR(16) NOT NULL, source_key VARCHAR(64) NOT NULL, value INT NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_1F20B89A1409DD88 ON sf6.neutral_observation_resource (observation_id)');
        $this->addSql('CREATE INDEX idx_neutral_observation_resource_key_value ON sf6.neutral_observation_resource (source_key, side, value)');
        $this->addSql('CREATE INDEX idx_neutral_observation_resource_object ON sf6.neutral_observation_resource (character_object_id)');
        $this->addSql('CREATE UNIQUE INDEX uniq_neutral_observation_resource_side_key ON sf6.neutral_observation_resource (observation_id, side, source_key)');
        $this->addSql('ALTER TABLE sf6.neutral_observation_resource ADD CONSTRAINT FK_1F20B89A1409DD88 FOREIGN KEY (observation_id) REFERENCES sf6.neutral_observation (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.neutral_observation_resource ADD CONSTRAINT FK_1F20B89AA47DF410 FOREIGN KEY (character_object_id) REFERENCES sf6.character_object (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE sf6.neutral_observation_resource');
        $this->addSql('DROP TABLE sf6.neutral_observation');
        $this->addSql('ALTER TABLE sf6.replay_player DROP control_scheme');
        $this->addSql('ALTER TABLE sf6.replay DROP neutral_imported_at');
        $this->addSql('ALTER TABLE sf6.replay DROP neutral_algorithm_version');
        $this->addSql('ALTER TABLE sf6.frame_data DROP move_name');
    }
}
