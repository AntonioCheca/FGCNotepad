<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260929100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add notation translation rules (replay export notation -> catalogue notation)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE sf6.notation_translation (id SERIAL NOT NULL, character_id UUID DEFAULT NULL, match_kind VARCHAR(16) NOT NULL, source_pattern VARCHAR(255) NOT NULL, replacement VARCHAR(255) NOT NULL, priority INT DEFAULT 0 NOT NULL, note TEXT DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_notation_translation_character ON sf6.notation_translation (character_id)');
        $this->addSql("ALTER TABLE sf6.notation_translation ADD CONSTRAINT chk_notation_translation_match_kind CHECK (match_kind IN ('exact', 'regex'))");
        $this->addSql('ALTER TABLE sf6.notation_translation ADD CONSTRAINT fk_notation_translation_character FOREIGN KEY (character_id) REFERENCES sf6.character (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql("COMMENT ON COLUMN sf6.notation_translation.character_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN sf6.notation_translation.created_at IS '(DC2Type:datetime_immutable)'");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE sf6.notation_translation');
    }
}
