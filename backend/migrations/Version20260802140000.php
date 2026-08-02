<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260802140000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add gap-anchored Blockstring attacker adaptations';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('DROP TABLE IF EXISTS sf6.blockstring_adaptation CASCADE');
        $this->addSql('CREATE TABLE sf6.blockstring_adaptation (id SERIAL NOT NULL, sequence_id INT NOT NULL, gap_id INT NOT NULL, explanation TEXT DEFAULT NULL, sort_order SMALLINT DEFAULT 1 NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_blockstring_adaptation_sequence ON sf6.blockstring_adaptation (sequence_id)');
        $this->addSql('CREATE INDEX idx_blockstring_adaptation_gap ON sf6.blockstring_adaptation (gap_id)');
        $this->addSql('CREATE TABLE sf6.blockstring_adaptation_step (id SERIAL NOT NULL, adaptation_id INT NOT NULL, move_id UUID NOT NULL, ordinal INT NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_blockstring_adaptation_step_adaptation ON sf6.blockstring_adaptation_step (adaptation_id, ordinal)');
        $this->addSql('CREATE INDEX idx_blockstring_adaptation_step_move ON sf6.blockstring_adaptation_step (move_id)');
        $this->addSql("COMMENT ON COLUMN sf6.blockstring_adaptation_step.move_id IS '(DC2Type:uuid)'");
        $this->addSql('CREATE TABLE sf6.blockstring_adaptation_combo_search (id SERIAL NOT NULL, adaptation_id INT NOT NULL, character_id UUID NOT NULL, first_move_id UUID DEFAULT NULL, ender_move_id UUID DEFAULT NULL, situation_id INT DEFAULT NULL, min_damage INT DEFAULT NULL, max_damage INT DEFAULT NULL, min_drive_cost NUMERIC(4, 1) DEFAULT NULL, max_drive_cost NUMERIC(4, 1) DEFAULT NULL, counter_hit_required BOOLEAN DEFAULT NULL, punish_counter_required BOOLEAN DEFAULT NULL, corner_required BOOLEAN DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX uniq_blockstring_adaptation_combo_search_adaptation ON sf6.blockstring_adaptation_combo_search (adaptation_id)');
        $this->addSql('CREATE INDEX idx_blockstring_adaptation_combo_search_character ON sf6.blockstring_adaptation_combo_search (character_id)');
        $this->addSql('CREATE INDEX idx_blockstring_adaptation_combo_search_first_move ON sf6.blockstring_adaptation_combo_search (first_move_id)');
        $this->addSql('CREATE INDEX idx_blockstring_adaptation_combo_search_situation ON sf6.blockstring_adaptation_combo_search (situation_id)');
        $this->addSql("COMMENT ON COLUMN sf6.blockstring_adaptation_combo_search.character_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN sf6.blockstring_adaptation_combo_search.first_move_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN sf6.blockstring_adaptation_combo_search.ender_move_id IS '(DC2Type:uuid)'");
        $this->addSql('ALTER TABLE sf6.blockstring_adaptation ADD CONSTRAINT FK_BLOCKSTRING_ADAPTATION_SEQUENCE FOREIGN KEY (sequence_id) REFERENCES sf6.blockstring_sequence (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_adaptation ADD CONSTRAINT FK_BLOCKSTRING_ADAPTATION_GAP FOREIGN KEY (gap_id) REFERENCES sf6.blockstring_gap (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_adaptation_step ADD CONSTRAINT FK_BLOCKSTRING_ADAPTATION_STEP_ADAPTATION FOREIGN KEY (adaptation_id) REFERENCES sf6.blockstring_adaptation (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_adaptation_step ADD CONSTRAINT FK_BLOCKSTRING_ADAPTATION_STEP_MOVE FOREIGN KEY (move_id) REFERENCES sf6.move (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_adaptation_combo_search ADD CONSTRAINT FK_BLOCKSTRING_ADAPTATION_COMBO_SEARCH_ADAPTATION FOREIGN KEY (adaptation_id) REFERENCES sf6.blockstring_adaptation (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_adaptation_combo_search ADD CONSTRAINT FK_BLOCKSTRING_ADAPTATION_COMBO_SEARCH_CHARACTER FOREIGN KEY (character_id) REFERENCES sf6.character (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_adaptation_combo_search ADD CONSTRAINT FK_BLOCKSTRING_ADAPTATION_COMBO_SEARCH_FIRST_MOVE FOREIGN KEY (first_move_id) REFERENCES sf6.move (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_adaptation_combo_search ADD CONSTRAINT FK_BLOCKSTRING_ADAPTATION_COMBO_SEARCH_ENDER_MOVE FOREIGN KEY (ender_move_id) REFERENCES sf6.move (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_adaptation_combo_search ADD CONSTRAINT FK_BLOCKSTRING_ADAPTATION_COMBO_SEARCH_SITUATION FOREIGN KEY (situation_id) REFERENCES sf6.situation (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE IF EXISTS sf6.blockstring_adaptation_combo_search');
        $this->addSql('DROP TABLE IF EXISTS sf6.blockstring_adaptation_step');
        $this->addSql('DROP TABLE IF EXISTS sf6.blockstring_adaptation');
        $this->addSql('CREATE TABLE sf6.blockstring_adaptation (id SERIAL NOT NULL, source_sequence_id INT NOT NULL, target_sequence_id INT DEFAULT NULL, actor_side VARCHAR(24) NOT NULL, explanation TEXT NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_blockstring_adaptation_source ON sf6.blockstring_adaptation (source_sequence_id)');
        $this->addSql('CREATE INDEX IDX_59E63EBF9FD4E8DE ON sf6.blockstring_adaptation (target_sequence_id)');
        $this->addSql('ALTER TABLE sf6.blockstring_adaptation ADD CONSTRAINT FK_59E63EBF38D3866E FOREIGN KEY (source_sequence_id) REFERENCES sf6.blockstring_sequence (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_adaptation ADD CONSTRAINT FK_59E63EBF9FD4E8DE FOREIGN KEY (target_sequence_id) REFERENCES sf6.blockstring_sequence (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
    }
}
