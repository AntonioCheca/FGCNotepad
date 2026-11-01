<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261031120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Reference cell perspective: "opponent" subtracts the linked scenario EV (null = same side)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.scenario_cell ADD reference_perspective VARCHAR(8) DEFAULT NULL');
        $this->addSql("ALTER TABLE sf6.scenario_cell ADD CONSTRAINT chk_scenario_cell_reference_perspective CHECK (reference_perspective IS NULL OR reference_perspective = 'opponent')");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.scenario_cell DROP CONSTRAINT chk_scenario_cell_reference_perspective');
        $this->addSql('ALTER TABLE sf6.scenario_cell DROP reference_perspective');
    }
}
