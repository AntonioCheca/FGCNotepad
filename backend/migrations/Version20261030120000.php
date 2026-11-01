<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261030120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Reference cell weight: the share of the linked scenario EV a reference cell counts (null = 1)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.scenario_cell ADD reference_weight DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.scenario_cell ADD CONSTRAINT chk_scenario_cell_reference_weight CHECK (reference_weight IS NULL OR (reference_weight > 0 AND reference_weight <= 1))');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.scenario_cell DROP CONSTRAINT chk_scenario_cell_reference_weight');
        $this->addSql('ALTER TABLE sf6.scenario_cell DROP reference_weight');
    }
}
