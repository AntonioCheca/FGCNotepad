<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250303195508 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA forum');
        $this->addSql('CREATE TABLE "forum"."post" (id SERIAL NOT NULL, author_id INT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, last_modified TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_5DD90525F675F31B ON "forum"."post" (author_id)');
        $this->addSql('COMMENT ON COLUMN "forum"."post".created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE "forum"."user" (id SERIAL NOT NULL, username VARCHAR(180) NOT NULL, roles JSON NOT NULL, password VARCHAR(255) NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_IDENTIFIER_USERNAME ON "forum"."user" (username)');
        $this->addSql('ALTER TABLE "forum"."post" ADD CONSTRAINT FK_5DD90525F675F31B FOREIGN KEY (author_id) REFERENCES "forum"."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE post DROP CONSTRAINT fk_5a8a6c8df675f31b');
        $this->addSql('DROP TABLE "user"');
        $this->addSql('DROP TABLE post');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('CREATE TABLE "user" (id SERIAL NOT NULL, username VARCHAR(180) NOT NULL, roles JSON NOT NULL, password VARCHAR(255) NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX uniq_identifier_username ON "user" (username)');
        $this->addSql('CREATE TABLE post (id SERIAL NOT NULL, author_id INT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, last_modified TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_5a8a6c8df675f31b ON post (author_id)');
        $this->addSql('COMMENT ON COLUMN post.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER TABLE post ADD CONSTRAINT fk_5a8a6c8df675f31b FOREIGN KEY (author_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "forum"."post" DROP CONSTRAINT FK_5DD90525F675F31B');
        $this->addSql('DROP TABLE "forum"."post"');
        $this->addSql('DROP TABLE "forum"."user"');
    }
}
