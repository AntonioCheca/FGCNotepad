<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250303210546 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add basic component entities';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA sf6');
        $this->addSql('CREATE TABLE sf6.combo (id UUID NOT NULL, numpad_notation TEXT NOT NULL, damage INT NOT NULL, PRIMARY KEY(id))');
        $this->addSql('COMMENT ON COLUMN sf6.combo.id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE sf6.component (id UUID NOT NULL, type VARCHAR(255) NOT NULL, PRIMARY KEY(id))');
        $this->addSql('COMMENT ON COLUMN sf6.component.id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE sf6.move (id UUID NOT NULL, numpad_notation TEXT NOT NULL, startup INT NOT NULL, PRIMARY KEY(id))');
        $this->addSql('COMMENT ON COLUMN sf6.move.id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE forum.post_components (post_id UUID NOT NULL, component_id UUID NOT NULL, PRIMARY KEY(post_id, component_id))');
        $this->addSql('CREATE INDEX IDX_EA66FC214B89032C ON forum.post_components (post_id)');
        $this->addSql('CREATE INDEX IDX_EA66FC21E2ABAFFF ON forum.post_components (component_id)');
        $this->addSql('COMMENT ON COLUMN forum.post_components.post_id IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN forum.post_components.component_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE sf6.combo ADD CONSTRAINT FK_B8A871FBBF396750 FOREIGN KEY (id) REFERENCES sf6.component (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.move ADD CONSTRAINT FK_CD33AD74BF396750 FOREIGN KEY (id) REFERENCES sf6.component (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE forum.post_components ADD CONSTRAINT FK_EA66FC214B89032C FOREIGN KEY (post_id) REFERENCES forum.post (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE forum.post_components ADD CONSTRAINT FK_EA66FC21E2ABAFFF FOREIGN KEY (component_id) REFERENCES sf6.component (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE forum.post DROP CONSTRAINT FK_5DD90525F675F31B');
        $this->addSql('ALTER TABLE forum.post ADD CONSTRAINT FK_5DD90525F675F31B FOREIGN KEY (author_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE sf6.combo DROP CONSTRAINT FK_B8A871FBBF396750');
        $this->addSql('ALTER TABLE sf6.move DROP CONSTRAINT FK_CD33AD74BF396750');
        $this->addSql('ALTER TABLE forum.post_components DROP CONSTRAINT FK_EA66FC214B89032C');
        $this->addSql('ALTER TABLE forum.post_components DROP CONSTRAINT FK_EA66FC21E2ABAFFF');
        $this->addSql('DROP TABLE sf6.combo');
        $this->addSql('DROP TABLE sf6.component');
        $this->addSql('DROP TABLE sf6.move');
        $this->addSql('DROP TABLE forum.post_components');
        $this->addSql('ALTER TABLE forum.post DROP CONSTRAINT fk_5dd90525f675f31b');
        $this->addSql('ALTER TABLE forum.post ADD CONSTRAINT fk_5dd90525f675f31b FOREIGN KEY (author_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }
}
