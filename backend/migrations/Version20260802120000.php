<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260802120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Normalize blockstring gaps, remove offense plans, and target defense entries by gap step';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry ADD gap_step_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry ADD defender_character_id UUID DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry ADD move_id UUID DEFAULT NULL');
        $this->addSql("ALTER TABLE sf6.blockstring_defense_entry ADD response_type VARCHAR(40) DEFAULT 'button' NOT NULL");
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry ADD startup_frames INT DEFAULT NULL');
        $this->addSql("ALTER TABLE sf6.blockstring_defense_entry ADD outcome VARCHAR(40) DEFAULT 'counter_hit' NOT NULL");
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry ADD conversion TEXT DEFAULT NULL');
        $this->addSql("COMMENT ON COLUMN sf6.blockstring_defense_entry.defender_character_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN sf6.blockstring_defense_entry.move_id IS '(DC2Type:uuid)'");

        $this->addSql('UPDATE sf6.blockstring_sequence_step SET gap_frames = NULL WHERE is_gap_before = false');
        $this->addSql('UPDATE sf6.blockstring_defense_entry entry SET gap_step_id = step.id FROM sf6.blockstring_sequence_step step WHERE step.sequence_id = entry.sequence_id AND step.ordinal = entry.act_after_step + 1 AND step.is_gap_before = true');
        $this->addSql('UPDATE sf6.blockstring_defense_entry entry SET gap_step_id = step.id FROM sf6.blockstring_sequence_step step WHERE step.sequence_id = entry.sequence_id AND step.is_gap_before = true AND entry.gap_step_id IS NULL AND step.id = (SELECT first_gap.id FROM sf6.blockstring_sequence_step first_gap WHERE first_gap.sequence_id = entry.sequence_id AND first_gap.is_gap_before = true ORDER BY first_gap.ordinal ASC, first_gap.id ASC LIMIT 1)');
        $this->addSql("UPDATE sf6.blockstring_defense_entry entry SET defender_character_id = answer.defender_character_id, move_id = answer.move_id, response_type = answer.response_type, startup_frames = answer.startup_frames, outcome = answer.outcome, conversion = answer.conversion FROM (SELECT DISTINCT ON (entry_id) entry_id, defender_character_id, move_id, response_type, startup_frames, outcome, conversion FROM sf6.blockstring_defense_answer ORDER BY entry_id, recommended DESC, id ASC) answer WHERE answer.entry_id = entry.id");
        $this->addSql('DELETE FROM sf6.blockstring_defense_entry WHERE gap_step_id IS NULL');

        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry ALTER gap_step_id SET NOT NULL');
        $this->addSql('CREATE INDEX idx_blockstring_defense_entry_gap_step ON sf6.blockstring_defense_entry (gap_step_id)');
        $this->addSql('CREATE INDEX idx_blockstring_defense_entry_defender ON sf6.blockstring_defense_entry (defender_character_id)');
        $this->addSql('CREATE INDEX IDX_9C5BAA05975C7E7 ON sf6.blockstring_defense_entry (move_id)');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry ADD CONSTRAINT FK_9C5BAA05FE071454 FOREIGN KEY (gap_step_id) REFERENCES sf6.blockstring_sequence_step (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry ADD CONSTRAINT FK_9C5BAA051FB47A79 FOREIGN KEY (defender_character_id) REFERENCES sf6.character (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry ADD CONSTRAINT FK_9C5BAA05975C7E7 FOREIGN KEY (move_id) REFERENCES sf6.move (id) NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('DROP TABLE sf6.blockstring_hit_confirm_rule');
        $this->addSql('DROP TABLE sf6.blockstring_defense_answer');
        $this->addSql('DROP TABLE sf6.blockstring_offense_plan');
        $this->addSql('ALTER TABLE sf6.blockstring_sequence DROP gap_after_step');
        $this->addSql('ALTER TABLE sf6.blockstring_sequence DROP max_interrupt_startup');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry DROP act_after_step');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.blockstring_sequence ADD gap_after_step INT DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.blockstring_sequence ADD max_interrupt_startup INT DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry ADD act_after_step INT DEFAULT NULL');
        $this->addSql('UPDATE sf6.blockstring_defense_entry entry SET act_after_step = step.ordinal - 1 FROM sf6.blockstring_sequence_step step WHERE step.id = entry.gap_step_id');

        $this->addSql('CREATE TABLE sf6.blockstring_offense_plan (id SERIAL NOT NULL, sequence_id INT NOT NULL, label TEXT NOT NULL, plan_role VARCHAR(40) NOT NULL, target_behavior VARCHAR(80) DEFAULT NULL, purpose TEXT DEFAULT NULL, on_hit TEXT DEFAULT NULL, on_block TEXT DEFAULT NULL, loses_to TEXT DEFAULT NULL, author_explanation TEXT DEFAULT NULL, sort_order INT DEFAULT 0 NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_blockstring_offense_plan_sequence ON sf6.blockstring_offense_plan (sequence_id)');
        $this->addSql('ALTER TABLE sf6.blockstring_offense_plan ADD CONSTRAINT FK_C88933569B2796BE FOREIGN KEY (sequence_id) REFERENCES sf6.blockstring_sequence (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE TABLE sf6.blockstring_defense_answer (id SERIAL NOT NULL, entry_id INT NOT NULL, defender_character_id UUID DEFAULT NULL, move_id UUID DEFAULT NULL, response_type VARCHAR(40) NOT NULL, startup_frames INT DEFAULT NULL, outcome VARCHAR(40) NOT NULL, conversion TEXT DEFAULT NULL, recommended BOOLEAN DEFAULT false NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_blockstring_defense_answer_entry ON sf6.blockstring_defense_answer (entry_id)');
        $this->addSql('CREATE INDEX idx_blockstring_defense_answer_defender ON sf6.blockstring_defense_answer (defender_character_id)');
        $this->addSql('CREATE INDEX IDX_D10B43987975C7E7 ON sf6.blockstring_defense_answer (move_id)');
        $this->addSql("COMMENT ON COLUMN sf6.blockstring_defense_answer.defender_character_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN sf6.blockstring_defense_answer.move_id IS '(DC2Type:uuid)'");
        $this->addSql('ALTER TABLE sf6.blockstring_defense_answer ADD CONSTRAINT FK_D10B4398BA364942 FOREIGN KEY (entry_id) REFERENCES sf6.blockstring_defense_entry (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_answer ADD CONSTRAINT FK_D10B43981FB47A79 FOREIGN KEY (defender_character_id) REFERENCES sf6.character (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_answer ADD CONSTRAINT FK_D10B43987975C7E7 FOREIGN KEY (move_id) REFERENCES sf6.move (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('INSERT INTO sf6.blockstring_defense_answer (entry_id, defender_character_id, move_id, response_type, startup_frames, outcome, conversion, recommended) SELECT id, defender_character_id, move_id, response_type, startup_frames, outcome, conversion, true FROM sf6.blockstring_defense_entry');

        $this->addSql('CREATE TABLE sf6.blockstring_hit_confirm_rule (id SERIAL NOT NULL, offense_plan_id INT NOT NULL, combo_sequence_id INT DEFAULT NULL, step_ordinal INT NOT NULL, confirmable BOOLEAN DEFAULT true NOT NULL, note TEXT DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_blockstring_hit_confirm_plan ON sf6.blockstring_hit_confirm_rule (offense_plan_id)');
        $this->addSql('CREATE INDEX IDX_D5F765CEFBAD967E ON sf6.blockstring_hit_confirm_rule (combo_sequence_id)');
        $this->addSql('ALTER TABLE sf6.blockstring_hit_confirm_rule ADD CONSTRAINT FK_D5F765CE6235CF8A FOREIGN KEY (offense_plan_id) REFERENCES sf6.blockstring_offense_plan (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_hit_confirm_rule ADD CONSTRAINT FK_D5F765CEFBAD967E FOREIGN KEY (combo_sequence_id) REFERENCES sf6.combo_sequence (id) NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry DROP CONSTRAINT FK_9C5BAA05FE071454');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry DROP CONSTRAINT FK_9C5BAA051FB47A79');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry DROP CONSTRAINT FK_9C5BAA05975C7E7');
        $this->addSql('DROP INDEX sf6.idx_blockstring_defense_entry_gap_step');
        $this->addSql('DROP INDEX sf6.idx_blockstring_defense_entry_defender');
        $this->addSql('DROP INDEX sf6.IDX_9C5BAA05975C7E7');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry DROP gap_step_id');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry DROP defender_character_id');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry DROP move_id');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry DROP response_type');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry DROP startup_frames');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry DROP outcome');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry DROP conversion');
    }
}
