<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260419113000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add scenario_flag and combo_flag tables for community validation.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE sf6.scenario_flag (id SERIAL NOT NULL, scenario_id INT NOT NULL, reported_by_id UUID NOT NULL, comment TEXT DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_scenario_flag_scenario ON sf6.scenario_flag (scenario_id)');
        $this->addSql('CREATE INDEX idx_scenario_flag_reported_by ON sf6.scenario_flag (reported_by_id)');
        $this->addSql("COMMENT ON COLUMN sf6.scenario_flag.reported_by_id IS '(DC2Type:uuid)'");
        $this->addSql('ALTER TABLE sf6.scenario_flag ADD CONSTRAINT fk_scenario_flag_scenario FOREIGN KEY (scenario_id) REFERENCES sf6.scenario (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.scenario_flag ADD CONSTRAINT fk_scenario_flag_reported_by FOREIGN KEY (reported_by_id) REFERENCES forum."user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE TABLE sf6.combo_flag (id SERIAL NOT NULL, combo_id INT NOT NULL, reported_by_id UUID NOT NULL, comment TEXT DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_combo_flag_combo ON sf6.combo_flag (combo_id)');
        $this->addSql('CREATE INDEX idx_combo_flag_reported_by ON sf6.combo_flag (reported_by_id)');
        $this->addSql("COMMENT ON COLUMN sf6.combo_flag.reported_by_id IS '(DC2Type:uuid)'");
        $this->addSql('ALTER TABLE sf6.combo_flag ADD CONSTRAINT fk_combo_flag_combo FOREIGN KEY (combo_id) REFERENCES sf6.combo_sequence (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.combo_flag ADD CONSTRAINT fk_combo_flag_reported_by FOREIGN KEY (reported_by_id) REFERENCES forum."user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE sf6.scenario_flag');
        $this->addSql('DROP TABLE sf6.combo_flag');
    }
}
