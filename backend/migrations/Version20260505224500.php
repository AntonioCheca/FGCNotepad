<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260505224500 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add relational resource requirements for scenario matrix axes';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("CREATE TABLE sf6.scenario_row_resource_requirement (id SERIAL NOT NULL, row_id INT NOT NULL, position INT NOT NULL, resource_owner VARCHAR(16) NOT NULL, resource_type VARCHAR(16) NOT NULL, operator VARCHAR(8) NOT NULL, threshold_value DOUBLE PRECISION NOT NULL, PRIMARY KEY(id))");
        $this->addSql('CREATE INDEX idx_scenario_row_requirement_row ON sf6.scenario_row_resource_requirement (row_id)');
        $this->addSql('CREATE INDEX idx_scenario_row_requirement_position ON sf6.scenario_row_resource_requirement (row_id, position)');
        $this->addSql("ALTER TABLE sf6.scenario_row_resource_requirement ADD CONSTRAINT chk_scenario_row_requirement_owner CHECK (resource_owner IN ('attacker', 'defender'))");
        $this->addSql("ALTER TABLE sf6.scenario_row_resource_requirement ADD CONSTRAINT chk_scenario_row_requirement_type CHECK (resource_type IN ('health', 'drive', 'super'))");
        $this->addSql("ALTER TABLE sf6.scenario_row_resource_requirement ADD CONSTRAINT chk_scenario_row_requirement_operator CHECK (operator = '>=')");
        $this->addSql('ALTER TABLE sf6.scenario_row_resource_requirement ADD CONSTRAINT chk_scenario_row_requirement_threshold CHECK (threshold_value >= 0)');
        $this->addSql('ALTER TABLE sf6.scenario_row_resource_requirement ADD CONSTRAINT fk_scenario_row_requirement_row FOREIGN KEY (row_id) REFERENCES sf6.scenario_row (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql("CREATE TABLE sf6.scenario_column_resource_requirement (id SERIAL NOT NULL, column_id INT NOT NULL, position INT NOT NULL, resource_owner VARCHAR(16) NOT NULL, resource_type VARCHAR(16) NOT NULL, operator VARCHAR(8) NOT NULL, threshold_value DOUBLE PRECISION NOT NULL, PRIMARY KEY(id))");
        $this->addSql('CREATE INDEX idx_scenario_column_requirement_column ON sf6.scenario_column_resource_requirement (column_id)');
        $this->addSql('CREATE INDEX idx_scenario_column_requirement_position ON sf6.scenario_column_resource_requirement (column_id, position)');
        $this->addSql("ALTER TABLE sf6.scenario_column_resource_requirement ADD CONSTRAINT chk_scenario_column_requirement_owner CHECK (resource_owner IN ('attacker', 'defender'))");
        $this->addSql("ALTER TABLE sf6.scenario_column_resource_requirement ADD CONSTRAINT chk_scenario_column_requirement_type CHECK (resource_type IN ('health', 'drive', 'super'))");
        $this->addSql("ALTER TABLE sf6.scenario_column_resource_requirement ADD CONSTRAINT chk_scenario_column_requirement_operator CHECK (operator = '>=')");
        $this->addSql('ALTER TABLE sf6.scenario_column_resource_requirement ADD CONSTRAINT chk_scenario_column_requirement_threshold CHECK (threshold_value >= 0)');
        $this->addSql('ALTER TABLE sf6.scenario_column_resource_requirement ADD CONSTRAINT fk_scenario_column_requirement_column FOREIGN KEY (column_id) REFERENCES sf6.scenario_column (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE sf6.scenario_column_resource_requirement');
        $this->addSql('DROP TABLE sf6.scenario_row_resource_requirement');
    }
}
