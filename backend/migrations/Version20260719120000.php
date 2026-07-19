<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260719120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Remove posts feature tables';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('DROP TABLE IF EXISTS forum.post_components');
        $this->addSql('DROP TABLE IF EXISTS forum.post_tag');
        $this->addSql('DROP TABLE IF EXISTS forum.post');
    }

    public function down(Schema $schema): void
    {
        $this->addSql("CREATE TABLE forum.post (id UUID NOT NULL, author_id UUID NOT NULL, moderation_decided_by_id UUID DEFAULT NULL, title TEXT NOT NULL, body TEXT NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, last_modified TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, moderation_state VARCHAR(32) DEFAULT 'approved' NOT NULL, submitted_for_review_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, moderation_decided_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, moderation_reason TEXT DEFAULT NULL, PRIMARY KEY(id))");
        $this->addSql('CREATE INDEX IDX_5DD90525F675F31B ON forum.post (author_id)');
        $this->addSql('CREATE INDEX IDX_POST_MODERATION_DECIDED_BY ON forum.post (moderation_decided_by_id)');
        $this->addSql('CREATE INDEX IDX_POST_MODERATION_STATE ON forum.post (moderation_state)');
        $this->addSql("COMMENT ON COLUMN forum.post.id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.post.created_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("COMMENT ON COLUMN forum.post.moderation_decided_by_id IS '(DC2Type:uuid)'");
        $this->addSql('ALTER TABLE forum.post ADD CONSTRAINT FK_5DD90525F675F31B FOREIGN KEY (author_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE forum.post ADD CONSTRAINT FK_POST_MODERATION_DECIDED_BY FOREIGN KEY (moderation_decided_by_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE TABLE forum.post_components (post_id UUID NOT NULL, component_id UUID NOT NULL, PRIMARY KEY(post_id, component_id))');
        $this->addSql('CREATE INDEX IDX_EA66FC214B89032C ON forum.post_components (post_id)');
        $this->addSql('CREATE INDEX IDX_EA66FC21E2ABAFFF ON forum.post_components (component_id)');
        $this->addSql("COMMENT ON COLUMN forum.post_components.post_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.post_components.component_id IS '(DC2Type:uuid)'");
        $this->addSql('ALTER TABLE forum.post_components ADD CONSTRAINT FK_EA66FC214B89032C FOREIGN KEY (post_id) REFERENCES forum.post (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE forum.post_components ADD CONSTRAINT FK_EA66FC21E2ABAFFF FOREIGN KEY (component_id) REFERENCES sf6.component (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE TABLE forum.post_tag (post_id UUID NOT NULL, tag_id UUID NOT NULL, PRIMARY KEY(post_id, tag_id))');
        $this->addSql('CREATE INDEX IDX_9AE560814B89032C ON forum.post_tag (post_id)');
        $this->addSql('CREATE INDEX IDX_9AE56081BAD26311 ON forum.post_tag (tag_id)');
        $this->addSql("COMMENT ON COLUMN forum.post_tag.post_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN forum.post_tag.tag_id IS '(DC2Type:uuid)'");
        $this->addSql('ALTER TABLE forum.post_tag ADD CONSTRAINT FK_9AE560814B89032C FOREIGN KEY (post_id) REFERENCES forum.post (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE forum.post_tag ADD CONSTRAINT FK_9AE56081BAD26311 FOREIGN KEY (tag_id) REFERENCES forum.tag (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
    }
}
