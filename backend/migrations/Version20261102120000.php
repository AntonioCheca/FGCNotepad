<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261102120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Scenario aliases, and scenario resource grids: equilibria precomputed for every Drive, Super, stock and corner combo combination';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE sf6.scenario_alias (id SERIAL NOT NULL, scenario_id INT NOT NULL, alias VARCHAR(80) NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX uniq_scenario_alias_scenario ON sf6.scenario_alias (scenario_id)');
        $this->addSql('CREATE UNIQUE INDEX uniq_scenario_alias_alias ON sf6.scenario_alias (alias)');
        $this->addSql('ALTER TABLE sf6.scenario_alias ADD CONSTRAINT fk_scenario_alias_scenario FOREIGN KEY (scenario_id) REFERENCES sf6.scenario (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE TABLE sf6.scenario_resource_grid (id SERIAL NOT NULL, scenario_id INT NOT NULL, computed_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, attacker_object_key VARCHAR(64) DEFAULT NULL, attacker_object_max SMALLINT NOT NULL, defender_object_key VARCHAR(64) DEFAULT NULL, defender_object_max SMALLINT NOT NULL, corner_toggle BOOLEAN NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX uniq_scenario_resource_grid_scenario ON sf6.scenario_resource_grid (scenario_id)');
        $this->addSql("COMMENT ON COLUMN sf6.scenario_resource_grid.computed_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql('ALTER TABLE sf6.scenario_resource_grid ADD CONSTRAINT fk_scenario_resource_grid_scenario FOREIGN KEY (scenario_id) REFERENCES sf6.scenario (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE TABLE sf6.scenario_resource_grid_solution (id SERIAL NOT NULL, grid_id INT NOT NULL, position SMALLINT NOT NULL, expected_value DOUBLE PRECISION DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX uniq_scenario_resource_grid_solution_position ON sf6.scenario_resource_grid_solution (grid_id, position)');
        $this->addSql('ALTER TABLE sf6.scenario_resource_grid_solution ADD CONSTRAINT fk_scenario_resource_grid_solution_grid FOREIGN KEY (grid_id) REFERENCES sf6.scenario_resource_grid (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE TABLE sf6.scenario_resource_grid_probability (id SERIAL NOT NULL, solution_id INT NOT NULL, side VARCHAR(8) NOT NULL, axis_position SMALLINT NOT NULL, probability DOUBLE PRECISION NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_scenario_resource_grid_probability_solution ON sf6.scenario_resource_grid_probability (solution_id)');
        $this->addSql("ALTER TABLE sf6.scenario_resource_grid_probability ADD CONSTRAINT chk_scenario_resource_grid_probability_side CHECK (side IN ('row', 'column'))");
        $this->addSql('ALTER TABLE sf6.scenario_resource_grid_probability ADD CONSTRAINT fk_scenario_resource_grid_probability_solution FOREIGN KEY (solution_id) REFERENCES sf6.scenario_resource_grid_solution (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE TABLE sf6.scenario_resource_grid_run (id SERIAL NOT NULL, grid_id INT NOT NULL, start_index INT NOT NULL, solution_position SMALLINT NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX uniq_scenario_resource_grid_run_start ON sf6.scenario_resource_grid_run (grid_id, start_index)');
        $this->addSql('ALTER TABLE sf6.scenario_resource_grid_run ADD CONSTRAINT fk_scenario_resource_grid_run_grid FOREIGN KEY (grid_id) REFERENCES sf6.scenario_resource_grid (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE sf6.scenario_resource_grid_run');
        $this->addSql('DROP TABLE sf6.scenario_resource_grid_probability');
        $this->addSql('DROP TABLE sf6.scenario_resource_grid_solution');
        $this->addSql('DROP TABLE sf6.scenario_resource_grid');
        $this->addSql('DROP TABLE sf6.scenario_alias');
    }
}
