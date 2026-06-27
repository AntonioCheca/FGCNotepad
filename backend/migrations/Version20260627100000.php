<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260627100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add ReplayVideo source metadata for YouTube-backed review sessions';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE forum.replay_video ADD source_type VARCHAR(32) NOT NULL DEFAULT 'upload'");
        $this->addSql('ALTER TABLE forum.replay_video ADD youtube_video_id VARCHAR(32) DEFAULT NULL');
        $this->addSql('ALTER TABLE forum.replay_video ADD youtube_url VARCHAR(512) DEFAULT NULL');
        $this->addSql('ALTER TABLE forum.replay_video ALTER storage_key DROP NOT NULL');
        $this->addSql('CREATE INDEX idx_replay_video_source_type ON forum.replay_video (source_type)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql("UPDATE forum.replay_video SET storage_key = '' WHERE storage_key IS NULL");
        $this->addSql('DROP INDEX forum.idx_replay_video_source_type');
        $this->addSql('ALTER TABLE forum.replay_video DROP youtube_url');
        $this->addSql('ALTER TABLE forum.replay_video DROP youtube_video_id');
        $this->addSql('ALTER TABLE forum.replay_video DROP source_type');
        $this->addSql('ALTER TABLE forum.replay_video ALTER storage_key SET NOT NULL');
    }
}
