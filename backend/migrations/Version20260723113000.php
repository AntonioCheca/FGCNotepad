<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260723113000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add one-time registration invite codes';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE forum.registration_invite_code (id UUID NOT NULL, used_by_id UUID DEFAULT NULL, code_hash VARCHAR(64) NOT NULL, label VARCHAR(180) DEFAULT NULL, is_used BOOLEAN DEFAULT false NOT NULL, used_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_REGISTRATION_INVITE_CODE_HASH ON forum.registration_invite_code (code_hash)');
        $this->addSql('CREATE INDEX IDX_REGISTRATION_INVITE_USED_BY ON forum.registration_invite_code (used_by_id)');
        $this->addSql("COMMENT ON COLUMN forum.registration_invite_code.id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.registration_invite_code.used_by_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.registration_invite_code.created_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN forum.registration_invite_code.used_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql('ALTER TABLE forum.registration_invite_code ADD CONSTRAINT FK_REGISTRATION_INVITE_USED_BY FOREIGN KEY (used_by_id) REFERENCES forum."user" (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE forum.registration_invite_code DROP CONSTRAINT FK_REGISTRATION_INVITE_USED_BY');
        $this->addSql('DROP TABLE forum.registration_invite_code');
    }
}
