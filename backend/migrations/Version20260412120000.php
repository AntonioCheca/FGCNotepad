<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260412120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Standardize scenario canonical fields for matrix references';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.scenario ADD public_id UUID DEFAULT NULL');
        $this->addSql("UPDATE sf6.scenario SET public_id = (
            substr(md5(id::text || '-' || coalesce(name, '')), 1, 8) || '-' ||
            substr(md5(id::text || '-' || coalesce(name, '')), 9, 4) || '-' ||
            substr(md5(id::text || '-' || coalesce(name, '')), 13, 4) || '-' ||
            substr(md5(id::text || '-' || coalesce(name, '')), 17, 4) || '-' ||
            substr(md5(id::text || '-' || coalesce(name, '')), 21, 12)
        )::uuid WHERE public_id IS NULL");
        $this->addSql('ALTER TABLE sf6.scenario ALTER public_id SET NOT NULL');
        $this->addSql("ALTER TABLE sf6.scenario ADD search_label TEXT DEFAULT '' NOT NULL");
        $this->addSql('UPDATE sf6.scenario SET search_label = lower(trim(name))');
        $this->addSql("ALTER TABLE sf6.scenario ADD payload JSONB DEFAULT '{}'::jsonb NOT NULL");
        $this->addSql('ALTER TABLE sf6.scenario ADD created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NOW() NOT NULL');
        $this->addSql('ALTER TABLE sf6.scenario ADD updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NOW() NOT NULL');
        $this->addSql('ALTER TABLE sf6.scenario ADD author_id UUID DEFAULT NULL');
        $this->addSql('CREATE UNIQUE INDEX idx_scenario_public_id ON sf6.scenario (public_id)');
        $this->addSql('CREATE INDEX idx_scenario_search_label ON sf6.scenario (search_label)');
        $this->addSql('CREATE INDEX IDX_E4D975E5F675F31B ON sf6.scenario (author_id)');
        $this->addSql('ALTER TABLE sf6.scenario ADD CONSTRAINT FK_E4D975E5F675F31B FOREIGN KEY (author_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql("COMMENT ON COLUMN sf6.scenario.public_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN sf6.scenario.author_id IS '(DC2Type:uuid)'");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.scenario DROP CONSTRAINT FK_E4D975E5F675F31B');
        $this->addSql('DROP INDEX idx_scenario_public_id');
        $this->addSql('DROP INDEX idx_scenario_search_label');
        $this->addSql('DROP INDEX IDX_E4D975E5F675F31B');
        $this->addSql('ALTER TABLE sf6.scenario DROP public_id');
        $this->addSql('ALTER TABLE sf6.scenario DROP search_label');
        $this->addSql('ALTER TABLE sf6.scenario DROP payload');
        $this->addSql('ALTER TABLE sf6.scenario DROP created_at');
        $this->addSql('ALTER TABLE sf6.scenario DROP updated_at');
        $this->addSql('ALTER TABLE sf6.scenario DROP author_id');
    }
}
