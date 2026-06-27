<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260625120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create Replay Lab review, clip, practice task, and study card tables';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE forum.replay_video (id UUID NOT NULL, owner_user_id UUID NOT NULL, original_filename VARCHAR(255) NOT NULL, storage_key VARCHAR(512) NOT NULL, mime_type VARCHAR(128) NOT NULL, size_bytes BIGINT NOT NULL, duration_ms INT NOT NULL, fps DOUBLE PRECISION DEFAULT NULL, status VARCHAR(32) NOT NULL, delete_after TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql("COMMENT ON COLUMN forum.replay_video.id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.replay_video.owner_user_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.replay_video.delete_after IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN forum.replay_video.deleted_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN forum.replay_video.created_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN forum.replay_video.updated_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql('CREATE INDEX idx_replay_video_owner_status ON forum.replay_video (owner_user_id, status)');
        $this->addSql('CREATE INDEX idx_replay_video_delete_after ON forum.replay_video (delete_after)');
        $this->addSql('ALTER TABLE forum.replay_video ADD CONSTRAINT fk_replay_video_owner FOREIGN KEY (owner_user_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE TABLE forum.replay_review_session (id UUID NOT NULL, video_id UUID NOT NULL, owner_user_id UUID NOT NULL, created_by_user_id UUID NOT NULL, title VARCHAR(255) NOT NULL, status VARCHAR(32) NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql("COMMENT ON COLUMN forum.replay_review_session.id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.replay_review_session.video_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.replay_review_session.owner_user_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.replay_review_session.created_by_user_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.replay_review_session.created_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN forum.replay_review_session.updated_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql('CREATE INDEX idx_replay_review_session_owner_status ON forum.replay_review_session (owner_user_id, status)');
        $this->addSql('CREATE INDEX idx_replay_review_session_video ON forum.replay_review_session (video_id)');
        $this->addSql('ALTER TABLE forum.replay_review_session ADD CONSTRAINT fk_replay_review_session_video FOREIGN KEY (video_id) REFERENCES forum.replay_video (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE forum.replay_review_session ADD CONSTRAINT fk_replay_review_session_owner FOREIGN KEY (owner_user_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE forum.replay_review_session ADD CONSTRAINT fk_replay_review_session_created_by FOREIGN KEY (created_by_user_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE TABLE forum.replay_annotation (id UUID NOT NULL, session_id UUID NOT NULL, created_by_user_id UUID NOT NULL, exported_clip_id UUID DEFAULT NULL, start_time_ms INT NOT NULL, end_time_ms INT NOT NULL, start_frame INT DEFAULT NULL, end_frame INT DEFAULT NULL, event_kind VARCHAR(32) NOT NULL, category VARCHAR(64) NOT NULL, title VARCHAR(255) DEFAULT NULL, notes TEXT DEFAULT NULL, answer TEXT DEFAULT NULL, export_error TEXT DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql("COMMENT ON COLUMN forum.replay_annotation.id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.replay_annotation.session_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.replay_annotation.created_by_user_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.replay_annotation.exported_clip_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.replay_annotation.created_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN forum.replay_annotation.updated_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql('CREATE INDEX idx_replay_annotation_session ON forum.replay_annotation (session_id)');
        $this->addSql('CREATE INDEX idx_replay_annotation_event_kind_category ON forum.replay_annotation (event_kind, category)');
        $this->addSql('CREATE UNIQUE INDEX uniq_replay_annotation_exported_clip ON forum.replay_annotation (exported_clip_id)');
        $this->addSql('ALTER TABLE forum.replay_annotation ADD CONSTRAINT fk_replay_annotation_session FOREIGN KEY (session_id) REFERENCES forum.replay_review_session (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE forum.replay_annotation ADD CONSTRAINT fk_replay_annotation_created_by FOREIGN KEY (created_by_user_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE TABLE forum.replay_clip (id UUID NOT NULL, owner_user_id UUID NOT NULL, source_video_id UUID DEFAULT NULL, source_annotation_id UUID NOT NULL, storage_key VARCHAR(512) NOT NULL, mime_type VARCHAR(128) NOT NULL, size_bytes BIGINT NOT NULL, duration_ms INT NOT NULL, start_time_ms INT NOT NULL, end_time_ms INT NOT NULL, start_frame INT DEFAULT NULL, end_frame INT DEFAULT NULL, status VARCHAR(32) NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql("COMMENT ON COLUMN forum.replay_clip.id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.replay_clip.owner_user_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.replay_clip.source_video_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.replay_clip.source_annotation_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.replay_clip.created_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN forum.replay_clip.updated_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN forum.replay_clip.deleted_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql('CREATE UNIQUE INDEX uniq_replay_clip_source_annotation ON forum.replay_clip (source_annotation_id)');
        $this->addSql('CREATE INDEX idx_replay_clip_owner_status ON forum.replay_clip (owner_user_id, status)');
        $this->addSql('ALTER TABLE forum.replay_clip ADD CONSTRAINT fk_replay_clip_owner FOREIGN KEY (owner_user_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE forum.replay_clip ADD CONSTRAINT fk_replay_clip_source_video FOREIGN KEY (source_video_id) REFERENCES forum.replay_video (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE forum.replay_clip ADD CONSTRAINT fk_replay_clip_source_annotation FOREIGN KEY (source_annotation_id) REFERENCES forum.replay_annotation (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE forum.replay_annotation ADD CONSTRAINT fk_replay_annotation_exported_clip FOREIGN KEY (exported_clip_id) REFERENCES forum.replay_clip (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE TABLE forum.practice_task (id UUID NOT NULL, user_id UUID NOT NULL, source_annotation_id UUID DEFAULT NULL, clip_id UUID DEFAULT NULL, title VARCHAR(255) NOT NULL, description TEXT NOT NULL, category VARCHAR(64) NOT NULL, status VARCHAR(32) NOT NULL, due_date TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, schedule_type VARCHAR(32) NOT NULL, remaining_occurrences INT NOT NULL, completed_occurrences INT NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, completed_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql("COMMENT ON COLUMN forum.practice_task.id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.practice_task.user_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.practice_task.source_annotation_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.practice_task.clip_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.practice_task.due_date IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN forum.practice_task.created_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN forum.practice_task.updated_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN forum.practice_task.completed_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql('CREATE UNIQUE INDEX uniq_practice_task_source_annotation ON forum.practice_task (source_annotation_id)');
        $this->addSql('CREATE INDEX idx_practice_task_user_status_due ON forum.practice_task (user_id, status, due_date)');
        $this->addSql('ALTER TABLE forum.practice_task ADD CONSTRAINT fk_practice_task_user FOREIGN KEY (user_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE forum.practice_task ADD CONSTRAINT fk_practice_task_source_annotation FOREIGN KEY (source_annotation_id) REFERENCES forum.replay_annotation (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE forum.practice_task ADD CONSTRAINT fk_practice_task_clip FOREIGN KEY (clip_id) REFERENCES forum.replay_clip (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE TABLE forum.study_card (id UUID NOT NULL, user_id UUID NOT NULL, source_annotation_id UUID DEFAULT NULL, clip_id UUID DEFAULT NULL, front_type VARCHAR(32) NOT NULL, prompt TEXT NOT NULL, correct_answer TEXT NOT NULL, category VARCHAR(64) NOT NULL, due_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, stability DOUBLE PRECISION DEFAULT NULL, difficulty DOUBLE PRECISION DEFAULT NULL, interval_days INT NOT NULL, repetition_count INT NOT NULL, lapse_count INT NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, suspended_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql("COMMENT ON COLUMN forum.study_card.id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.study_card.user_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.study_card.source_annotation_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.study_card.clip_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.study_card.due_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN forum.study_card.created_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN forum.study_card.updated_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN forum.study_card.suspended_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql('CREATE UNIQUE INDEX uniq_study_card_source_annotation ON forum.study_card (source_annotation_id)');
        $this->addSql('CREATE INDEX idx_study_card_user_due ON forum.study_card (user_id, due_at)');
        $this->addSql('ALTER TABLE forum.study_card ADD CONSTRAINT fk_study_card_user FOREIGN KEY (user_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE forum.study_card ADD CONSTRAINT fk_study_card_source_annotation FOREIGN KEY (source_annotation_id) REFERENCES forum.replay_annotation (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE forum.study_card ADD CONSTRAINT fk_study_card_clip FOREIGN KEY (clip_id) REFERENCES forum.replay_clip (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE TABLE forum.study_review_log (id UUID NOT NULL, card_id UUID NOT NULL, user_id UUID NOT NULL, rating VARCHAR(16) NOT NULL, was_correct BOOLEAN NOT NULL, reviewed_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, previous_due_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, next_due_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql("COMMENT ON COLUMN forum.study_review_log.id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.study_review_log.card_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.study_review_log.user_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.study_review_log.reviewed_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN forum.study_review_log.previous_due_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN forum.study_review_log.next_due_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql('CREATE INDEX idx_study_review_log_card_reviewed ON forum.study_review_log (card_id, reviewed_at)');
        $this->addSql('CREATE INDEX idx_study_review_log_user_reviewed ON forum.study_review_log (user_id, reviewed_at)');
        $this->addSql('ALTER TABLE forum.study_review_log ADD CONSTRAINT fk_study_review_log_card FOREIGN KEY (card_id) REFERENCES forum.study_card (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE forum.study_review_log ADD CONSTRAINT fk_study_review_log_user FOREIGN KEY (user_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE forum.study_review_log');
        $this->addSql('DROP TABLE forum.study_card');
        $this->addSql('DROP TABLE forum.practice_task');
        $this->addSql('ALTER TABLE forum.replay_annotation DROP CONSTRAINT fk_replay_annotation_exported_clip');
        $this->addSql('DROP TABLE forum.replay_clip');
        $this->addSql('DROP TABLE forum.replay_annotation');
        $this->addSql('DROP TABLE forum.replay_review_session');
        $this->addSql('DROP TABLE forum.replay_video');
    }
}
