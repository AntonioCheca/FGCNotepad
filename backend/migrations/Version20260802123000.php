<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260802123000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Promote blockstring gaps to first-class rows targeted by defense entries';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("CREATE TABLE sf6.blockstring_gap (id SERIAL NOT NULL, sequence_id INT NOT NULL, step_id INT NOT NULL, timing VARCHAR(32) NOT NULL, frames INT NOT NULL, note TEXT DEFAULT NULL, PRIMARY KEY(id))");
        $this->addSql('CREATE INDEX idx_blockstring_gap_sequence ON sf6.blockstring_gap (sequence_id)');
        $this->addSql('CREATE INDEX idx_blockstring_gap_step ON sf6.blockstring_gap (step_id)');
        $this->addSql('ALTER TABLE sf6.blockstring_gap ADD CONSTRAINT FK_7C37F8269B2796BE FOREIGN KEY (sequence_id) REFERENCES sf6.blockstring_sequence (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_gap ADD CONSTRAINT FK_7C37F82663E8B7A6 FOREIGN KEY (step_id) REFERENCES sf6.blockstring_sequence_step (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql("INSERT INTO sf6.blockstring_gap (sequence_id, step_id, timing, frames, note) SELECT sequence_id, id, 'before_step', COALESCE(gap_frames, 0), NULL FROM sf6.blockstring_sequence_step WHERE is_gap_before = true");
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry ADD gap_id INT DEFAULT NULL');
        $this->addSql('UPDATE sf6.blockstring_defense_entry entry SET gap_id = gap.id FROM sf6.blockstring_gap gap WHERE gap.step_id = entry.gap_step_id');
        $this->addSql('DELETE FROM sf6.blockstring_defense_entry WHERE gap_id IS NULL');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry ALTER gap_id SET NOT NULL');
        $this->addSql('CREATE INDEX idx_blockstring_defense_entry_gap ON sf6.blockstring_defense_entry (gap_id)');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry ADD CONSTRAINT FK_9C5BAA05FA2D9D6 FOREIGN KEY (gap_id) REFERENCES sf6.blockstring_gap (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry DROP CONSTRAINT FK_9C5BAA05FE071454');
        $this->addSql('DROP INDEX sf6.idx_blockstring_defense_entry_gap_step');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry DROP gap_step_id');
        $this->addSql('ALTER TABLE sf6.blockstring_sequence_step DROP is_gap_before');
        $this->addSql('ALTER TABLE sf6.blockstring_sequence_step DROP gap_frames');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.blockstring_sequence_step ADD is_gap_before BOOLEAN DEFAULT false NOT NULL');
        $this->addSql('ALTER TABLE sf6.blockstring_sequence_step ADD gap_frames INT DEFAULT NULL');
        $this->addSql("UPDATE sf6.blockstring_sequence_step step SET is_gap_before = true, gap_frames = gap.frames FROM sf6.blockstring_gap gap WHERE gap.step_id = step.id AND gap.timing = 'before_step'");

        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry ADD gap_step_id INT DEFAULT NULL');
        $this->addSql('UPDATE sf6.blockstring_defense_entry entry SET gap_step_id = gap.step_id FROM sf6.blockstring_gap gap WHERE gap.id = entry.gap_id');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry ALTER gap_step_id SET NOT NULL');
        $this->addSql('CREATE INDEX idx_blockstring_defense_entry_gap_step ON sf6.blockstring_defense_entry (gap_step_id)');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry ADD CONSTRAINT FK_9C5BAA05FE071454 FOREIGN KEY (gap_step_id) REFERENCES sf6.blockstring_sequence_step (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry DROP CONSTRAINT FK_9C5BAA05FA2D9D6');
        $this->addSql('DROP INDEX sf6.idx_blockstring_defense_entry_gap');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry DROP gap_id');
        $this->addSql('DROP TABLE sf6.blockstring_gap');
    }
}
