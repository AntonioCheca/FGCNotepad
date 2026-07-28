<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260728130000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add combo spacing lookup and optional combo classification';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE sf6.combo_spacing (id SERIAL NOT NULL, code VARCHAR(64) NOT NULL, name VARCHAR(120) NOT NULL, description TEXT NOT NULL, sort_order INT NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX uniq_combo_spacing_code ON sf6.combo_spacing (code)');
        $this->addSql(<<<'SQL'
INSERT INTO sf6.combo_spacing (code, name, description, sort_order, created_at, updated_at) VALUES
('close', 'Close', 'The combo requires the starter to connect from close range.', 10, NOW(), NOW()),
('mid', 'Mid', 'The combo works from a normal intermediate distance but is not intended for maximum-range contact.', 20, NOW(), NOW()),
('tip', 'Tip', 'The combo works when the starter connects near the end of its normal active range against a normal hurtbox.', 30, NOW(), NOW()),
('punish_tip', 'Punish tip', 'The starter connects because the punished move has an extended hurtbox. This is farther than the starter''s normal tip range.', 40, NOW(), NOW())
SQL);
        $this->addSql('ALTER TABLE sf6.combo_sequence ADD spacing_id INT DEFAULT NULL');
        $this->addSql('CREATE INDEX IDX_COMBO_SEQUENCE_SPACING ON sf6.combo_sequence (spacing_id)');
        $this->addSql('ALTER TABLE sf6.combo_sequence ADD CONSTRAINT FK_COMBO_SEQUENCE_SPACING FOREIGN KEY (spacing_id) REFERENCES sf6.combo_spacing (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.combo_sequence DROP CONSTRAINT FK_COMBO_SEQUENCE_SPACING');
        $this->addSql('DROP INDEX IF EXISTS sf6.IDX_COMBO_SEQUENCE_SPACING');
        $this->addSql('ALTER TABLE sf6.combo_sequence DROP spacing_id');
        $this->addSql('DROP TABLE sf6.combo_spacing');
    }
}
