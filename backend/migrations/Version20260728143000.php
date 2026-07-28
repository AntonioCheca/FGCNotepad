<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260728143000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add saved situations and initial opponent state compatibility metadata';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE sf6.situation_type (id SERIAL NOT NULL, code VARCHAR(64) NOT NULL, name VARCHAR(120) NOT NULL, description TEXT NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX uniq_situation_type_code ON sf6.situation_type (code)');
        $this->addSql(<<<'SQL'
INSERT INTO sf6.situation_type (code, name, description, created_at, updated_at) VALUES
('blocked_move', 'Blocked move', 'Punishing an opponent move after blocking it.', NOW(), NOW()),
('whiffed_move', 'Whiffed move', 'Punishing an opponent move after it misses.', NOW(), NOW()),
('drive_impact_pc_state', 'Drive Impact Punish Counter state', 'Punish Counter state caused by Drive Impact.', NOW(), NOW()),
('stun', 'Stun', 'Opponent stun state.', NOW(), NOW())
SQL);

        $this->addSql('CREATE TABLE sf6.situation (id SERIAL NOT NULL, type_id INT NOT NULL, name VARCHAR(160) NOT NULL, description TEXT NOT NULL, opponent_character_id UUID DEFAULT NULL, move_id UUID DEFAULT NULL, frame_advantage SMALLINT DEFAULT NULL, punish_window_frames SMALLINT DEFAULT NULL, starting_distance_meters NUMERIC(6, 3) DEFAULT NULL, opponent_state VARCHAR(32) NOT NULL, initial_juggle_altitude VARCHAR(32) DEFAULT NULL, corner_state VARCHAR(32) NOT NULL, counter_hit_state VARCHAR(32) NOT NULL, notes TEXT DEFAULT NULL, is_verified BOOLEAN DEFAULT false NOT NULL, is_archived BOOLEAN DEFAULT false NOT NULL, created_by_id UUID DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_SITUATION_TYPE ON sf6.situation (type_id)');
        $this->addSql('CREATE INDEX IDX_SITUATION_OPPONENT_CHARACTER ON sf6.situation (opponent_character_id)');
        $this->addSql('CREATE INDEX IDX_SITUATION_MOVE ON sf6.situation (move_id)');
        $this->addSql('CREATE INDEX IDX_SITUATION_CREATED_BY ON sf6.situation (created_by_id)');
        $this->addSql('CREATE INDEX idx_situation_state_filters ON sf6.situation (opponent_state, corner_state, counter_hit_state)');
        $this->addSql('ALTER TABLE sf6.situation ADD CONSTRAINT FK_SITUATION_TYPE FOREIGN KEY (type_id) REFERENCES sf6.situation_type (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.situation ADD CONSTRAINT FK_SITUATION_OPPONENT_CHARACTER FOREIGN KEY (opponent_character_id) REFERENCES sf6.character (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.situation ADD CONSTRAINT FK_SITUATION_MOVE FOREIGN KEY (move_id) REFERENCES sf6.move (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.situation ADD CONSTRAINT FK_SITUATION_CREATED_BY FOREIGN KEY (created_by_id) REFERENCES forum."user" (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('ALTER TABLE sf6.combo_requirement ADD initial_opponent_posture VARCHAR(16) DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.combo_requirement ADD initial_opponent_ground_state VARCHAR(16) DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.combo_requirement ADD initial_juggle_altitude VARCHAR(16) DEFAULT NULL');
        $this->addSql("ALTER TABLE sf6.combo_requirement ADD CONSTRAINT chk_combo_requirement_initial_opponent_posture CHECK (initial_opponent_posture IS NULL OR initial_opponent_posture IN ('standing', 'crouching'))");
        $this->addSql("ALTER TABLE sf6.combo_requirement ADD CONSTRAINT chk_combo_requirement_initial_opponent_ground_state CHECK (initial_opponent_ground_state IS NULL OR initial_opponent_ground_state IN ('grounded', 'airborne'))");
        $this->addSql("ALTER TABLE sf6.combo_requirement ADD CONSTRAINT chk_combo_requirement_initial_juggle_altitude CHECK (initial_juggle_altitude IS NULL OR initial_juggle_altitude IN ('low', 'medium', 'high'))");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.combo_requirement DROP CONSTRAINT chk_combo_requirement_initial_juggle_altitude');
        $this->addSql('ALTER TABLE sf6.combo_requirement DROP CONSTRAINT chk_combo_requirement_initial_opponent_ground_state');
        $this->addSql('ALTER TABLE sf6.combo_requirement DROP CONSTRAINT chk_combo_requirement_initial_opponent_posture');
        $this->addSql('ALTER TABLE sf6.combo_requirement DROP initial_juggle_altitude');
        $this->addSql('ALTER TABLE sf6.combo_requirement DROP initial_opponent_ground_state');
        $this->addSql('ALTER TABLE sf6.combo_requirement DROP initial_opponent_posture');
        $this->addSql('ALTER TABLE sf6.situation DROP CONSTRAINT FK_SITUATION_CREATED_BY');
        $this->addSql('ALTER TABLE sf6.situation DROP CONSTRAINT FK_SITUATION_MOVE');
        $this->addSql('ALTER TABLE sf6.situation DROP CONSTRAINT FK_SITUATION_OPPONENT_CHARACTER');
        $this->addSql('ALTER TABLE sf6.situation DROP CONSTRAINT FK_SITUATION_TYPE');
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_situation_state_filters');
        $this->addSql('DROP INDEX IF EXISTS sf6.IDX_SITUATION_CREATED_BY');
        $this->addSql('DROP INDEX IF EXISTS sf6.IDX_SITUATION_MOVE');
        $this->addSql('DROP INDEX IF EXISTS sf6.IDX_SITUATION_OPPONENT_CHARACTER');
        $this->addSql('DROP INDEX IF EXISTS sf6.IDX_SITUATION_TYPE');
        $this->addSql('DROP TABLE sf6.situation');
        $this->addSql('DROP TABLE sf6.situation_type');
    }
}
