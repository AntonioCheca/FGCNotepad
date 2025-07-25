<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250725202233 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Adding combo related tables';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE sf6.combo_metrics (id SERIAL NOT NULL, sequence_id INT NOT NULL, damage INT NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_6B24484F98FB19AE ON sf6.combo_metrics (sequence_id)');
        $this->addSql('CREATE TABLE sf6.combo_requirement (id SERIAL NOT NULL, sequence_id INT NOT NULL, counter_hit_required BOOLEAN NOT NULL, punish_counter_required BOOLEAN NOT NULL, corner_required BOOLEAN NOT NULL, airborne_required BOOLEAN NOT NULL, mid_screen_required BOOLEAN NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_C602082798FB19AE ON sf6.combo_requirement (sequence_id)');
        $this->addSql('CREATE TABLE sf6.combo_sequence (id SERIAL NOT NULL, move_id UUID DEFAULT NULL, type_id INT NOT NULL, name TEXT NOT NULL, description TEXT NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_8AC252136DC541A8 ON sf6.combo_sequence (move_id)');
        $this->addSql('CREATE INDEX IDX_8AC25213C54C8C93 ON sf6.combo_sequence (type_id)');
        $this->addSql('COMMENT ON COLUMN sf6.combo_sequence.move_id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE sf6.combo_sequence_type (id SERIAL NOT NULL, name TEXT NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE TABLE sf6.connection_type (id SERIAL NOT NULL, name TEXT NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE TABLE sf6.requirement_specific_character (id SERIAL NOT NULL, requirement_id INT NOT NULL, object_name TEXT NOT NULL, status_required TEXT NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_A1C1D6E47B576F77 ON sf6.requirement_specific_character (requirement_id)');
        $this->addSql('CREATE TABLE sf6.step_combo (id SERIAL NOT NULL, parent_sequence_id INT NOT NULL, child_sequence_id INT NOT NULL, connection_type_id INT NOT NULL, ordinal_in_combo INT NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_88C9722CF3D70BDE ON sf6.step_combo (parent_sequence_id)');
        $this->addSql('CREATE INDEX IDX_88C9722C427F7E80 ON sf6.step_combo (child_sequence_id)');
        $this->addSql('CREATE INDEX IDX_88C9722CBE466AB0 ON sf6.step_combo (connection_type_id)');
        $this->addSql('ALTER TABLE sf6.combo_metrics ADD CONSTRAINT FK_6B24484F98FB19AE FOREIGN KEY (sequence_id) REFERENCES sf6.combo_sequence (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.combo_requirement ADD CONSTRAINT FK_C602082798FB19AE FOREIGN KEY (sequence_id) REFERENCES sf6.combo_sequence (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.combo_sequence ADD CONSTRAINT FK_8AC252136DC541A8 FOREIGN KEY (move_id) REFERENCES sf6.move (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.combo_sequence ADD CONSTRAINT FK_8AC25213C54C8C93 FOREIGN KEY (type_id) REFERENCES sf6.combo_sequence_type (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.requirement_specific_character ADD CONSTRAINT FK_A1C1D6E47B576F77 FOREIGN KEY (requirement_id) REFERENCES sf6.combo_requirement (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.step_combo ADD CONSTRAINT FK_88C9722CF3D70BDE FOREIGN KEY (parent_sequence_id) REFERENCES sf6.combo_sequence (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.step_combo ADD CONSTRAINT FK_88C9722C427F7E80 FOREIGN KEY (child_sequence_id) REFERENCES sf6.combo_sequence (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.step_combo ADD CONSTRAINT FK_88C9722CBE466AB0 FOREIGN KEY (connection_type_id) REFERENCES sf6.connection_type (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.combo DROP CONSTRAINT fk_b8a871fbbf396750');
        $this->addSql('DROP TABLE sf6.combo');
        $this->addSql('ALTER TABLE sf6.move DROP CONSTRAINT FK_CD33AD741136BE75');
        $this->addSql('ALTER TABLE sf6.move ADD CONSTRAINT FK_CD33AD74EC3BC191 FOREIGN KEY (frame_data_id) REFERENCES sf6.frame_data (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.move ADD CONSTRAINT FK_CD33AD741136BE75 FOREIGN KEY (character_id) REFERENCES sf6.character (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE forum.post DROP CONSTRAINT FK_5DD90525F675F31B');
        $this->addSql('ALTER TABLE forum.post ALTER author_id DROP NOT NULL');
        $this->addSql('ALTER TABLE forum.post ADD CONSTRAINT FK_5DD90525F675F31B FOREIGN KEY (author_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE sf6.combo (id UUID NOT NULL, numpad_notation TEXT NOT NULL, damage INT NOT NULL, PRIMARY KEY(id))');
        $this->addSql('COMMENT ON COLUMN sf6.combo.id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE sf6.combo ADD CONSTRAINT fk_b8a871fbbf396750 FOREIGN KEY (id) REFERENCES sf6.component (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.combo_metrics DROP CONSTRAINT FK_6B24484F98FB19AE');
        $this->addSql('ALTER TABLE sf6.combo_requirement DROP CONSTRAINT FK_C602082798FB19AE');
        $this->addSql('ALTER TABLE sf6.combo_sequence DROP CONSTRAINT FK_8AC252136DC541A8');
        $this->addSql('ALTER TABLE sf6.combo_sequence DROP CONSTRAINT FK_8AC25213C54C8C93');
        $this->addSql('ALTER TABLE sf6.requirement_specific_character DROP CONSTRAINT FK_A1C1D6E47B576F77');
        $this->addSql('ALTER TABLE sf6.step_combo DROP CONSTRAINT FK_88C9722CF3D70BDE');
        $this->addSql('ALTER TABLE sf6.step_combo DROP CONSTRAINT FK_88C9722C427F7E80');
        $this->addSql('ALTER TABLE sf6.step_combo DROP CONSTRAINT FK_88C9722CBE466AB0');
        $this->addSql('DROP TABLE sf6.combo_metrics');
        $this->addSql('DROP TABLE sf6.combo_requirement');
        $this->addSql('DROP TABLE sf6.combo_sequence');
        $this->addSql('DROP TABLE sf6.combo_sequence_type');
        $this->addSql('DROP TABLE sf6.connection_type');
        $this->addSql('DROP TABLE sf6.requirement_specific_character');
        $this->addSql('DROP TABLE sf6.step_combo');
        $this->addSql('ALTER TABLE sf6.move DROP CONSTRAINT FK_CD33AD74EC3BC191');
        $this->addSql('ALTER TABLE sf6.move DROP CONSTRAINT fk_cd33ad741136be75');
        $this->addSql('ALTER TABLE sf6.move ADD CONSTRAINT fk_cd33ad741136be75 FOREIGN KEY (character_id) REFERENCES sf6."character" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE forum.post DROP CONSTRAINT fk_5dd90525f675f31b');
        $this->addSql('ALTER TABLE forum.post ALTER author_id SET NOT NULL');
        $this->addSql('ALTER TABLE forum.post ADD CONSTRAINT fk_5dd90525f675f31b FOREIGN KEY (author_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }
}
