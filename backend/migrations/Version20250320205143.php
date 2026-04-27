<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20250320205143 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Added tags in Posts';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE forum.post_tag (post_id UUID NOT NULL, tag_id UUID NOT NULL, PRIMARY KEY(post_id, tag_id))');
        $this->addSql('CREATE INDEX IDX_9AE560814B89032C ON forum.post_tag (post_id)');
        $this->addSql('CREATE INDEX IDX_9AE56081BAD26311 ON forum.post_tag (tag_id)');
        $this->addSql('COMMENT ON COLUMN forum.post_tag.post_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN forum.post_tag.tag_id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE forum.tag (id UUID NOT NULL, name TEXT NOT NULL, PRIMARY KEY(id))');
        $this->addSql('COMMENT ON COLUMN forum.tag.id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE forum.post_tag ADD CONSTRAINT FK_9AE560814B89032C FOREIGN KEY (post_id) REFERENCES forum.post (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE forum.post_tag ADD CONSTRAINT FK_9AE56081BAD26311 FOREIGN KEY (tag_id) REFERENCES forum.tag (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE forum.post_tag DROP CONSTRAINT FK_9AE560814B89032C');
        $this->addSql('ALTER TABLE forum.post_tag DROP CONSTRAINT FK_9AE56081BAD26311');
        $this->addSql('DROP TABLE forum.post_tag');
        $this->addSql('DROP TABLE forum.tag');
    }
}
