<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260728123000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add forces standing manual move metadata flag';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.move_manual_metadata ADD forces_standing BOOLEAN DEFAULT FALSE NOT NULL');
        $this->addSql('CREATE INDEX idx_move_manual_metadata_forces_standing ON sf6.move_manual_metadata (forces_standing)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_move_manual_metadata_forces_standing');
        $this->addSql('ALTER TABLE sf6.move_manual_metadata DROP forces_standing');
    }
}
