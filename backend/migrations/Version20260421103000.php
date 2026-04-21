<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260421103000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add layer integer columns to scenario axes';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.scenario_row ADD COLUMN IF NOT EXISTS layer INT NOT NULL DEFAULT 1');
        $this->addSql('ALTER TABLE sf6.scenario_column ADD COLUMN IF NOT EXISTS layer INT NOT NULL DEFAULT 1');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.scenario_row DROP COLUMN IF EXISTS layer');
        $this->addSql('ALTER TABLE sf6.scenario_column DROP COLUMN IF EXISTS layer');
    }
}
