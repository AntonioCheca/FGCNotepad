<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250303201436 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Change ids for UUIDs for current entities';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP SEQUENCE forum.post_id_seq CASCADE');
        $this->addSql('DROP SEQUENCE forum.user_id_seq CASCADE');
        $this->addSql('DROP TABLE forum.post');
        $this->addSql('DROP TABLE forum.user');
        $this->addSql('CREATE TABLE forum.post (id UUID NOT NULL, author_id UUID NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, last_modified TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_5DD90525F675F31B ON forum.post (author_id)');
        $this->addSql('COMMENT ON COLUMN forum.post.id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN forum.post.author_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN forum.post.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE forum."user" (id UUID NOT NULL, username VARCHAR(180) NOT NULL, roles JSON NOT NULL, password VARCHAR(255) NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_IDENTIFIER_USERNAME ON forum."user" (username)');
        $this->addSql('COMMENT ON COLUMN forum."user".id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE forum.post ADD CONSTRAINT FK_5DD90525F675F31B FOREIGN KEY (author_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP SEQUENCE forum.post_id_seq CASCADE');
        $this->addSql('DROP SEQUENCE forum.user_id_seq CASCADE');
        $this->addSql('DROP TABLE forum.post');
        $this->addSql('DROP TABLE forum.user');
        $this->addSql('CREATE TABLE "forum"."post" (id SERIAL NOT NULL, author_id INT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, last_modified TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_5DD90525F675F31B ON "forum"."post" (author_id)');
        $this->addSql('COMMENT ON COLUMN "forum"."post".created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE "forum"."user" (id SERIAL NOT NULL, username VARCHAR(180) NOT NULL, roles JSON NOT NULL, password VARCHAR(255) NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_IDENTIFIER_USERNAME ON "forum"."user" (username)');
        $this->addSql('ALTER TABLE "forum"."post" ADD CONSTRAINT FK_5DD90525F675F31B FOREIGN KEY (author_id) REFERENCES "forum"."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }
}
