<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261106120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Anonymous research article likes: one row per like, nothing stored about the visitor';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE sf6.research_article_like (id SERIAL NOT NULL, article_slug VARCHAR(120) NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_research_article_like_slug ON sf6.research_article_like (article_slug)');
        $this->addSql("COMMENT ON COLUMN sf6.research_article_like.created_at IS '(DC2Type:datetime_immutable)'");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE sf6.research_article_like');
    }
}
