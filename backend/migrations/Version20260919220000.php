<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260919220000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add author and moderation fields to Oki setups; existing setups stay approved';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE sf6.oki_setup ADD author_id UUID DEFAULT NULL, ADD moderation_decided_by_id UUID DEFAULT NULL, ADD moderation_state VARCHAR(32) DEFAULT 'approved' NOT NULL, ADD submitted_for_review_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, ADD moderation_decided_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, ADD moderation_reason TEXT DEFAULT NULL");
        $this->addSql("COMMENT ON COLUMN sf6.oki_setup.author_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN sf6.oki_setup.moderation_decided_by_id IS '(DC2Type:uuid)'");
        $this->addSql('ALTER TABLE sf6.oki_setup ADD CONSTRAINT FK_OKI_SETUP_AUTHOR FOREIGN KEY (author_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.oki_setup ADD CONSTRAINT FK_OKI_SETUP_DECIDED_BY FOREIGN KEY (moderation_decided_by_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE INDEX IDX_OKI_SETUP_AUTHOR ON sf6.oki_setup (author_id)');
        $this->addSql('CREATE INDEX IDX_OKI_SETUP_DECIDED_BY ON sf6.oki_setup (moderation_decided_by_id)');
        $this->addSql('CREATE INDEX idx_oki_setup_moderation ON sf6.oki_setup (moderation_state)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX sf6.idx_oki_setup_moderation');
        $this->addSql('DROP INDEX sf6.IDX_OKI_SETUP_DECIDED_BY');
        $this->addSql('DROP INDEX sf6.IDX_OKI_SETUP_AUTHOR');
        $this->addSql('ALTER TABLE sf6.oki_setup DROP CONSTRAINT FK_OKI_SETUP_DECIDED_BY');
        $this->addSql('ALTER TABLE sf6.oki_setup DROP CONSTRAINT FK_OKI_SETUP_AUTHOR');
        $this->addSql('ALTER TABLE sf6.oki_setup DROP author_id, DROP moderation_decided_by_id, DROP moderation_state, DROP submitted_for_review_at, DROP moderation_decided_at, DROP moderation_reason');
    }
}
