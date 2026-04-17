<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260417120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Decouple scenarios from posts and persist matrix in relational tables';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE sf6.scenario DROP COLUMN IF EXISTS payload");
        $this->addSql("ALTER TABLE sf6.scenario ADD COLUMN IF NOT EXISTS scenario_type VARCHAR(32) NOT NULL DEFAULT 'oki'");
        $this->addSql('ALTER TABLE sf6.scenario ADD COLUMN IF NOT EXISTS defender_character_id UUID DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.scenario ADD COLUMN IF NOT EXISTS attacker_character_id UUID DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.scenario ADD COLUMN IF NOT EXISTS trigger_move_id UUID DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.scenario ALTER COLUMN type_id DROP NOT NULL');

        $this->addSql('CREATE INDEX IF NOT EXISTS idx_scenario_type ON sf6.scenario (scenario_type)');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_scenario_defender_character ON sf6.scenario (defender_character_id)');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_scenario_attacker_character ON sf6.scenario (attacker_character_id)');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_scenario_trigger_move ON sf6.scenario (trigger_move_id)');

        $this->addSql('ALTER TABLE sf6.scenario DROP CONSTRAINT IF EXISTS fk_scenario_defender_character');
        $this->addSql('ALTER TABLE sf6.scenario DROP CONSTRAINT IF EXISTS fk_scenario_attacker_character');
        $this->addSql('ALTER TABLE sf6.scenario DROP CONSTRAINT IF EXISTS fk_scenario_trigger_move');
        $this->addSql('ALTER TABLE sf6.scenario ADD CONSTRAINT fk_scenario_defender_character FOREIGN KEY (defender_character_id) REFERENCES sf6.character (id) ON DELETE RESTRICT NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.scenario ADD CONSTRAINT fk_scenario_attacker_character FOREIGN KEY (attacker_character_id) REFERENCES sf6.character (id) ON DELETE RESTRICT NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.scenario ADD CONSTRAINT fk_scenario_trigger_move FOREIGN KEY (trigger_move_id) REFERENCES sf6.move (id) ON DELETE RESTRICT NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql("UPDATE sf6.scenario SET scenario_type = 'oki' WHERE scenario_type IS NULL OR scenario_type = ''");
        $this->addSql('TRUNCATE TABLE sf6.scenario CASCADE');
        $this->addSql('ALTER TABLE sf6.scenario ALTER COLUMN defender_character_id SET NOT NULL');
        $this->addSql('ALTER TABLE sf6.scenario ALTER COLUMN attacker_character_id SET NOT NULL');
        $this->addSql('ALTER TABLE sf6.scenario ALTER COLUMN trigger_move_id SET NOT NULL');
        $this->addSql("COMMENT ON COLUMN sf6.scenario.defender_character_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN sf6.scenario.attacker_character_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN sf6.scenario.trigger_move_id IS '(DC2Type:uuid)'");

        $this->addSql('CREATE TABLE IF NOT EXISTS sf6.scenario_row (id SERIAL NOT NULL, scenario_id INT NOT NULL, position INT NOT NULL, label TEXT NOT NULL, summary_value DOUBLE PRECISION DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_scenario_row_scenario ON sf6.scenario_row (scenario_id)');
        $this->addSql('CREATE UNIQUE INDEX IF NOT EXISTS uniq_scenario_row_position ON sf6.scenario_row (scenario_id, position)');
        $this->addSql('ALTER TABLE sf6.scenario_row DROP CONSTRAINT IF EXISTS fk_scenario_row_scenario');
        $this->addSql('ALTER TABLE sf6.scenario_row ADD CONSTRAINT fk_scenario_row_scenario FOREIGN KEY (scenario_id) REFERENCES sf6.scenario (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE TABLE IF NOT EXISTS sf6.scenario_column (id SERIAL NOT NULL, scenario_id INT NOT NULL, position INT NOT NULL, label TEXT NOT NULL, summary_value DOUBLE PRECISION DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_scenario_column_scenario ON sf6.scenario_column (scenario_id)');
        $this->addSql('CREATE UNIQUE INDEX IF NOT EXISTS uniq_scenario_column_position ON sf6.scenario_column (scenario_id, position)');
        $this->addSql('ALTER TABLE sf6.scenario_column DROP CONSTRAINT IF EXISTS fk_scenario_column_scenario');
        $this->addSql('ALTER TABLE sf6.scenario_column ADD CONSTRAINT fk_scenario_column_scenario FOREIGN KEY (scenario_id) REFERENCES sf6.scenario (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE TABLE IF NOT EXISTS sf6.scenario_cell (id SERIAL NOT NULL, scenario_id INT NOT NULL, row_id INT NOT NULL, column_id INT NOT NULL, kind VARCHAR(32) NOT NULL, static_value DOUBLE PRECISION DEFAULT NULL, reference_scenario_id INT DEFAULT NULL, reference_kind VARCHAR(16) DEFAULT NULL, cached_value DOUBLE PRECISION DEFAULT NULL, starter_context VARCHAR(24) DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_scenario_cell_scenario ON sf6.scenario_cell (scenario_id)');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_scenario_cell_row ON sf6.scenario_cell (row_id)');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_scenario_cell_column ON sf6.scenario_cell (column_id)');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_scenario_cell_reference_scenario ON sf6.scenario_cell (reference_scenario_id)');
        $this->addSql('CREATE UNIQUE INDEX IF NOT EXISTS uniq_scenario_cell_coordinates ON sf6.scenario_cell (scenario_id, row_id, column_id)');
        $this->addSql('ALTER TABLE sf6.scenario_cell DROP CONSTRAINT IF EXISTS fk_scenario_cell_scenario');
        $this->addSql('ALTER TABLE sf6.scenario_cell DROP CONSTRAINT IF EXISTS fk_scenario_cell_row');
        $this->addSql('ALTER TABLE sf6.scenario_cell DROP CONSTRAINT IF EXISTS fk_scenario_cell_column');
        $this->addSql('ALTER TABLE sf6.scenario_cell DROP CONSTRAINT IF EXISTS fk_scenario_cell_reference_scenario');
        $this->addSql('ALTER TABLE sf6.scenario_cell ADD CONSTRAINT fk_scenario_cell_scenario FOREIGN KEY (scenario_id) REFERENCES sf6.scenario (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.scenario_cell ADD CONSTRAINT fk_scenario_cell_row FOREIGN KEY (row_id) REFERENCES sf6.scenario_row (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.scenario_cell ADD CONSTRAINT fk_scenario_cell_column FOREIGN KEY (column_id) REFERENCES sf6.scenario_column (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.scenario_cell ADD CONSTRAINT fk_scenario_cell_reference_scenario FOREIGN KEY (reference_scenario_id) REFERENCES sf6.scenario (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE TABLE IF NOT EXISTS sf6.scenario_cell_starter_move (cell_id INT NOT NULL, move_id UUID NOT NULL, PRIMARY KEY(cell_id, move_id))');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_scenario_cell_starter_move_cell ON sf6.scenario_cell_starter_move (cell_id)');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_scenario_cell_starter_move_move ON sf6.scenario_cell_starter_move (move_id)');
        $this->addSql('ALTER TABLE sf6.scenario_cell_starter_move DROP CONSTRAINT IF EXISTS fk_scenario_cell_starter_move_cell');
        $this->addSql('ALTER TABLE sf6.scenario_cell_starter_move DROP CONSTRAINT IF EXISTS fk_scenario_cell_starter_move_move');
        $this->addSql('ALTER TABLE sf6.scenario_cell_starter_move ADD CONSTRAINT fk_scenario_cell_starter_move_cell FOREIGN KEY (cell_id) REFERENCES sf6.scenario_cell (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.scenario_cell_starter_move ADD CONSTRAINT fk_scenario_cell_starter_move_move FOREIGN KEY (move_id) REFERENCES sf6.move (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql("COMMENT ON COLUMN sf6.scenario_cell_starter_move.move_id IS '(DC2Type:uuid)'");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE IF EXISTS sf6.scenario_cell_starter_move');
        $this->addSql('DROP TABLE IF EXISTS sf6.scenario_cell');
        $this->addSql('DROP TABLE IF EXISTS sf6.scenario_column');
        $this->addSql('DROP TABLE IF EXISTS sf6.scenario_row');

        $this->addSql('ALTER TABLE sf6.scenario DROP CONSTRAINT IF EXISTS fk_scenario_defender_character');
        $this->addSql('ALTER TABLE sf6.scenario DROP CONSTRAINT IF EXISTS fk_scenario_attacker_character');
        $this->addSql('ALTER TABLE sf6.scenario DROP CONSTRAINT IF EXISTS fk_scenario_trigger_move');
        $this->addSql('ALTER TABLE sf6.scenario DROP COLUMN IF EXISTS scenario_type');
        $this->addSql('ALTER TABLE sf6.scenario DROP COLUMN IF EXISTS defender_character_id');
        $this->addSql('ALTER TABLE sf6.scenario DROP COLUMN IF EXISTS attacker_character_id');
        $this->addSql('ALTER TABLE sf6.scenario DROP COLUMN IF EXISTS trigger_move_id');
        $this->addSql("ALTER TABLE sf6.scenario ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb NOT NULL");
    }
}
