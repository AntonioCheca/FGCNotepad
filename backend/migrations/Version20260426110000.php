<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260426110000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add combo sequence author ownership';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.combo_sequence ADD author_id UUID DEFAULT NULL');
        $this->addSql('CREATE INDEX IDX_2A23FB4CF675F31B ON sf6.combo_sequence (author_id)');
        $this->addSql('ALTER TABLE sf6.combo_sequence ADD CONSTRAINT FK_2A23FB4CF675F31B FOREIGN KEY (author_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql("COMMENT ON COLUMN sf6.combo_sequence.author_id IS '(DC2Type:uuid)'");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.combo_sequence DROP CONSTRAINT FK_2A23FB4CF675F31B');
        $this->addSql('DROP INDEX IDX_2A23FB4CF675F31B');
        $this->addSql('ALTER TABLE sf6.combo_sequence DROP author_id');
    }
}
