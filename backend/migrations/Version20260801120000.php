<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260801120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add normalized blockstring sequence, offense, and defense tables';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("CREATE TABLE sf6.blockstring_sequence (id SERIAL NOT NULL, attacker_character_id UUID NOT NULL, author_id UUID DEFAULT NULL, moderation_decided_by_id UUID DEFAULT NULL, title TEXT NOT NULL, summary TEXT DEFAULT NULL, classification VARCHAR(32) NOT NULL, gap_after_step INT DEFAULT NULL, max_interrupt_startup INT DEFAULT NULL, moderation_state VARCHAR(32) NOT NULL, submitted_for_review_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, moderation_decided_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, moderation_reason TEXT DEFAULT NULL, PRIMARY KEY(id))");
        $this->addSql('CREATE INDEX idx_blockstring_sequence_attacker ON sf6.blockstring_sequence (attacker_character_id)');
        $this->addSql('CREATE INDEX idx_blockstring_sequence_classification ON sf6.blockstring_sequence (classification)');
        $this->addSql('CREATE INDEX idx_blockstring_sequence_moderation ON sf6.blockstring_sequence (moderation_state)');
        $this->addSql('CREATE INDEX IDX_866F9E00F675F31B ON sf6.blockstring_sequence (author_id)');
        $this->addSql('CREATE INDEX IDX_866F9E008821D50C ON sf6.blockstring_sequence (moderation_decided_by_id)');
        $this->addSql("COMMENT ON COLUMN sf6.blockstring_sequence.attacker_character_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN sf6.blockstring_sequence.author_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN sf6.blockstring_sequence.moderation_decided_by_id IS '(DC2Type:uuid)'");

        $this->addSql('CREATE TABLE sf6.blockstring_sequence_step (id SERIAL NOT NULL, sequence_id INT NOT NULL, move_id UUID NOT NULL, ordinal INT NOT NULL, is_gap_before BOOLEAN DEFAULT false NOT NULL, gap_frames INT DEFAULT NULL, can_confirm_on_hit BOOLEAN DEFAULT false NOT NULL, note TEXT DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_blockstring_sequence_step_sequence ON sf6.blockstring_sequence_step (sequence_id, ordinal)');
        $this->addSql('CREATE INDEX idx_blockstring_sequence_step_move ON sf6.blockstring_sequence_step (move_id)');
        $this->addSql("COMMENT ON COLUMN sf6.blockstring_sequence_step.move_id IS '(DC2Type:uuid)'");

        $this->addSql('CREATE TABLE sf6.blockstring_offense_plan (id SERIAL NOT NULL, sequence_id INT NOT NULL, label TEXT NOT NULL, plan_role VARCHAR(40) NOT NULL, target_behavior VARCHAR(80) DEFAULT NULL, purpose TEXT DEFAULT NULL, on_hit TEXT DEFAULT NULL, on_block TEXT DEFAULT NULL, loses_to TEXT DEFAULT NULL, author_explanation TEXT DEFAULT NULL, sort_order INT DEFAULT 0 NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_blockstring_offense_plan_sequence ON sf6.blockstring_offense_plan (sequence_id)');

        $this->addSql('CREATE TABLE sf6.blockstring_defense_entry (id SERIAL NOT NULL, sequence_id INT NOT NULL, act_after_step INT DEFAULT NULL, instruction TEXT DEFAULT NULL, exception_notes TEXT DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_blockstring_defense_entry_sequence ON sf6.blockstring_defense_entry (sequence_id)');

        $this->addSql('CREATE TABLE sf6.blockstring_defense_answer (id SERIAL NOT NULL, entry_id INT NOT NULL, defender_character_id UUID DEFAULT NULL, move_id UUID DEFAULT NULL, response_type VARCHAR(40) NOT NULL, startup_frames INT DEFAULT NULL, outcome VARCHAR(40) NOT NULL, conversion TEXT DEFAULT NULL, recommended BOOLEAN DEFAULT false NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_blockstring_defense_answer_entry ON sf6.blockstring_defense_answer (entry_id)');
        $this->addSql('CREATE INDEX idx_blockstring_defense_answer_defender ON sf6.blockstring_defense_answer (defender_character_id)');
        $this->addSql('CREATE INDEX IDX_D10B43987975C7E7 ON sf6.blockstring_defense_answer (move_id)');
        $this->addSql("COMMENT ON COLUMN sf6.blockstring_defense_answer.defender_character_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN sf6.blockstring_defense_answer.move_id IS '(DC2Type:uuid)'");

        $this->addSql('CREATE TABLE sf6.blockstring_condition (id SERIAL NOT NULL, sequence_id INT NOT NULL, kind VARCHAR(60) NOT NULL, value VARCHAR(120) NOT NULL, note TEXT DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_blockstring_condition_sequence ON sf6.blockstring_condition (sequence_id)');

        $this->addSql('CREATE TABLE sf6.blockstring_hit_confirm_rule (id SERIAL NOT NULL, offense_plan_id INT NOT NULL, combo_sequence_id INT DEFAULT NULL, step_ordinal INT NOT NULL, confirmable BOOLEAN DEFAULT true NOT NULL, note TEXT DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_blockstring_hit_confirm_plan ON sf6.blockstring_hit_confirm_rule (offense_plan_id)');
        $this->addSql('CREATE INDEX IDX_D5F765CEFBAD967E ON sf6.blockstring_hit_confirm_rule (combo_sequence_id)');

        $this->addSql('CREATE TABLE sf6.blockstring_adaptation (id SERIAL NOT NULL, source_sequence_id INT NOT NULL, target_sequence_id INT DEFAULT NULL, actor_side VARCHAR(24) NOT NULL, explanation TEXT NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_blockstring_adaptation_source ON sf6.blockstring_adaptation (source_sequence_id)');
        $this->addSql('CREATE INDEX IDX_59E63EBF9FD4E8DE ON sf6.blockstring_adaptation (target_sequence_id)');

        $this->addSql('ALTER TABLE sf6.blockstring_sequence ADD CONSTRAINT FK_866F9E0083C25C3B FOREIGN KEY (attacker_character_id) REFERENCES sf6.character (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_sequence ADD CONSTRAINT FK_866F9E00F675F31B FOREIGN KEY (author_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_sequence ADD CONSTRAINT FK_866F9E008821D50C FOREIGN KEY (moderation_decided_by_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_sequence_step ADD CONSTRAINT FK_C610D5539B2796BE FOREIGN KEY (sequence_id) REFERENCES sf6.blockstring_sequence (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_sequence_step ADD CONSTRAINT FK_C610D5538975C7E7 FOREIGN KEY (move_id) REFERENCES sf6.move (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_offense_plan ADD CONSTRAINT FK_C88933569B2796BE FOREIGN KEY (sequence_id) REFERENCES sf6.blockstring_sequence (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry ADD CONSTRAINT FK_9C5BAA059B2796BE FOREIGN KEY (sequence_id) REFERENCES sf6.blockstring_sequence (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_answer ADD CONSTRAINT FK_D10B4398BA364942 FOREIGN KEY (entry_id) REFERENCES sf6.blockstring_defense_entry (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_answer ADD CONSTRAINT FK_D10B43981FB47A79 FOREIGN KEY (defender_character_id) REFERENCES sf6.character (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_answer ADD CONSTRAINT FK_D10B43987975C7E7 FOREIGN KEY (move_id) REFERENCES sf6.move (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_condition ADD CONSTRAINT FK_6B86F5D99B2796BE FOREIGN KEY (sequence_id) REFERENCES sf6.blockstring_sequence (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_hit_confirm_rule ADD CONSTRAINT FK_D5F765CE6235CF8A FOREIGN KEY (offense_plan_id) REFERENCES sf6.blockstring_offense_plan (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_hit_confirm_rule ADD CONSTRAINT FK_D5F765CEFBAD967E FOREIGN KEY (combo_sequence_id) REFERENCES sf6.combo_sequence (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_adaptation ADD CONSTRAINT FK_59E63EBF38D3866E FOREIGN KEY (source_sequence_id) REFERENCES sf6.blockstring_sequence (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_adaptation ADD CONSTRAINT FK_59E63EBF9FD4E8DE FOREIGN KEY (target_sequence_id) REFERENCES sf6.blockstring_sequence (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE sf6.blockstring_adaptation');
        $this->addSql('DROP TABLE sf6.blockstring_hit_confirm_rule');
        $this->addSql('DROP TABLE sf6.blockstring_condition');
        $this->addSql('DROP TABLE sf6.blockstring_defense_answer');
        $this->addSql('DROP TABLE sf6.blockstring_defense_entry');
        $this->addSql('DROP TABLE sf6.blockstring_offense_plan');
        $this->addSql('DROP TABLE sf6.blockstring_sequence_step');
        $this->addSql('DROP TABLE sf6.blockstring_sequence');
    }
}
