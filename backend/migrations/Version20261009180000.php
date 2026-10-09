<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261009180000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Stores each scenario layer equilibrium (standard mode, no resource limits) so anonymous visitors can read it without a live solve';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE sf6.scenario_layer_solution (id SERIAL NOT NULL, scenario_id INT NOT NULL, layer INT NOT NULL, expected_value DOUBLE PRECISION DEFAULT NULL, solved_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX uniq_scenario_layer_solution_layer ON sf6.scenario_layer_solution (scenario_id, layer)');
        $this->addSql('ALTER TABLE sf6.scenario_layer_solution ADD CONSTRAINT fk_scenario_layer_solution_scenario FOREIGN KEY (scenario_id) REFERENCES sf6.scenario (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE TABLE sf6.scenario_layer_solution_row (id SERIAL NOT NULL, solution_id INT NOT NULL, row_id INT NOT NULL, probability DOUBLE PRECISION NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_scenario_layer_solution_row_solution ON sf6.scenario_layer_solution_row (solution_id)');
        $this->addSql('CREATE INDEX idx_scenario_layer_solution_row_row ON sf6.scenario_layer_solution_row (row_id)');
        $this->addSql('ALTER TABLE sf6.scenario_layer_solution_row ADD CONSTRAINT fk_scenario_layer_solution_row_solution FOREIGN KEY (solution_id) REFERENCES sf6.scenario_layer_solution (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.scenario_layer_solution_row ADD CONSTRAINT fk_scenario_layer_solution_row_row FOREIGN KEY (row_id) REFERENCES sf6.scenario_row (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE TABLE sf6.scenario_layer_solution_column (id SERIAL NOT NULL, solution_id INT NOT NULL, column_id INT NOT NULL, probability DOUBLE PRECISION NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_scenario_layer_solution_column_solution ON sf6.scenario_layer_solution_column (solution_id)');
        $this->addSql('CREATE INDEX idx_scenario_layer_solution_column_column ON sf6.scenario_layer_solution_column (column_id)');
        $this->addSql('ALTER TABLE sf6.scenario_layer_solution_column ADD CONSTRAINT fk_scenario_layer_solution_column_solution FOREIGN KEY (solution_id) REFERENCES sf6.scenario_layer_solution (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.scenario_layer_solution_column ADD CONSTRAINT fk_scenario_layer_solution_column_column FOREIGN KEY (column_id) REFERENCES sf6.scenario_column (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE sf6.scenario_layer_solution_column');
        $this->addSql('DROP TABLE sf6.scenario_layer_solution_row');
        $this->addSql('DROP TABLE sf6.scenario_layer_solution');
    }
}
