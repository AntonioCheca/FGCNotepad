<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260626130000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create Replay Lab shared review access token table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE forum.replay_review_access_token (id UUID NOT NULL, session_id UUID NOT NULL, created_by_user_id UUID NOT NULL, token_hash VARCHAR(64) NOT NULL, label VARCHAR(255) DEFAULT NULL, password_hash VARCHAR(255) DEFAULT NULL, expires_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, max_uses INT DEFAULT NULL, used_count INT NOT NULL, can_view BOOLEAN NOT NULL, can_annotate BOOLEAN NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, revoked_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql("COMMENT ON COLUMN forum.replay_review_access_token.id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.replay_review_access_token.session_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.replay_review_access_token.created_by_user_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.replay_review_access_token.expires_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN forum.replay_review_access_token.created_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN forum.replay_review_access_token.revoked_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql('CREATE UNIQUE INDEX uniq_replay_review_access_token_hash ON forum.replay_review_access_token (token_hash)');
        $this->addSql('CREATE INDEX idx_replay_review_access_token_session ON forum.replay_review_access_token (session_id)');
        $this->addSql('CREATE INDEX idx_replay_review_access_token_expires ON forum.replay_review_access_token (expires_at)');
        $this->addSql('ALTER TABLE forum.replay_review_access_token ADD CONSTRAINT fk_replay_review_access_token_session FOREIGN KEY (session_id) REFERENCES forum.replay_review_session (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE forum.replay_review_access_token ADD CONSTRAINT fk_replay_review_access_token_created_by FOREIGN KEY (created_by_user_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE forum.replay_review_access_token');
    }
}
