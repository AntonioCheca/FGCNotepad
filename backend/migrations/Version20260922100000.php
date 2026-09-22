<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260922100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Character resources become admin-editable definitions: character link, kind, start/reset/min settings and extractor key';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.character_object ADD character_id UUID DEFAULT NULL');
        $this->addSql("COMMENT ON COLUMN sf6.character_object.character_id IS '(DC2Type:uuid)'");
        $this->addSql("ALTER TABLE sf6.character_object ADD kind VARCHAR(16) DEFAULT 'stock' NOT NULL");
        $this->addSql("ALTER TABLE sf6.character_object ADD spend_behavior VARCHAR(16) DEFAULT 'consumed' NOT NULL");
        $this->addSql('ALTER TABLE sf6.character_object ADD starts_with INT DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE sf6.character_object ADD resets_each_round BOOLEAN DEFAULT false NOT NULL');
        $this->addSql('ALTER TABLE sf6.character_object ADD min_status INT DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE sf6.character_object ADD extractor_key TEXT DEFAULT NULL');
        $this->addSql("ALTER TABLE sf6.character_object ADD extractor_source VARCHAR(16) DEFAULT 'named' NOT NULL");
        $this->addSql('ALTER TABLE sf6.character_object ADD sort_order INT DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE sf6.character_object ADD CONSTRAINT FK_6CA4ADBB1136BE75 FOREIGN KEY (character_id) REFERENCES sf6.character (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE INDEX IDX_6CA4ADBB1136BE75 ON sf6.character_object (character_id)');

        $this->addSql("UPDATE sf6.character_object o SET character_id = c.id FROM sf6.character c WHERE lower(regexp_replace(c.name, '[^A-Za-z0-9]', '', 'g')) = lower(regexp_replace(o.character_name, '[^A-Za-z0-9]', '', 'g'))");
        $this->addSql("UPDATE sf6.character_object SET kind = CASE WHEN status_type = 'boolean' AND NOT can_be_consumed THEN 'state' WHEN status_type = 'integer' AND NOT can_be_consumed THEN 'scaler' ELSE 'stock' END, spend_behavior = CASE WHEN can_be_consumed THEN 'consumed' ELSE 'maintained' END");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX sf6.IDX_6CA4ADBB1136BE75');
        $this->addSql('ALTER TABLE sf6.character_object DROP CONSTRAINT FK_6CA4ADBB1136BE75');
        foreach (['character_id', 'kind', 'spend_behavior', 'starts_with', 'resets_each_round', 'min_status', 'extractor_key', 'extractor_source', 'sort_order'] as $column) {
            $this->addSql(sprintf('ALTER TABLE sf6.character_object DROP %s', $column));
        }
    }
}
