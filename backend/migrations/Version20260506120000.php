<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260506120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Normalize character-specific requirements and add scenario combo context';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("CREATE TABLE sf6.combo_requirement_specific_character (combo_requirement_id INT NOT NULL, requirement_specific_character_id INT NOT NULL, PRIMARY KEY(combo_requirement_id, requirement_specific_character_id))");
        $this->addSql('CREATE UNIQUE INDEX uniq_combo_requirement_specific_character_requirement ON sf6.combo_requirement_specific_character (requirement_specific_character_id)');
        $this->addSql('CREATE INDEX idx_combo_requirement_specific_character_combo ON sf6.combo_requirement_specific_character (combo_requirement_id)');
        $this->addSql('INSERT INTO sf6.combo_requirement_specific_character (combo_requirement_id, requirement_specific_character_id) SELECT requirement_id, id FROM sf6.requirement_specific_character');
        $this->addSql('ALTER TABLE sf6.combo_requirement_specific_character ADD CONSTRAINT fk_combo_requirement_specific_character_combo FOREIGN KEY (combo_requirement_id) REFERENCES sf6.combo_requirement (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.combo_requirement_specific_character ADD CONSTRAINT fk_combo_requirement_specific_character_requirement FOREIGN KEY (requirement_specific_character_id) REFERENCES sf6.requirement_specific_character (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('ALTER TABLE sf6.requirement_specific_character DROP CONSTRAINT FK_A1C1D6E47B576F77');
        $this->addSql('DROP INDEX sf6.UNIQ_A1C1D6E47B576F77');
        $this->addSql('ALTER TABLE sf6.requirement_specific_character DROP requirement_id');

        $this->addSql("CREATE TABLE sf6.scenario_combo_context (id SERIAL NOT NULL, scenario_id INT NOT NULL, position_lock VARCHAR(32) NOT NULL, PRIMARY KEY(id))");
        $this->addSql('CREATE UNIQUE INDEX uniq_scenario_combo_context_scenario ON sf6.scenario_combo_context (scenario_id)');
        $this->addSql("ALTER TABLE sf6.scenario_combo_context ADD CONSTRAINT chk_scenario_combo_context_position CHECK (position_lock IN ('viewer_default_midscreen', 'corner', 'midscreen'))");
        $this->addSql('ALTER TABLE sf6.scenario_combo_context ADD CONSTRAINT fk_scenario_combo_context_scenario FOREIGN KEY (scenario_id) REFERENCES sf6.scenario (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE TABLE sf6.scenario_requirement_specific_character (scenario_context_id INT NOT NULL, requirement_specific_character_id INT NOT NULL, PRIMARY KEY(scenario_context_id, requirement_specific_character_id))');
        $this->addSql('CREATE INDEX idx_scenario_requirement_specific_character_context ON sf6.scenario_requirement_specific_character (scenario_context_id)');
        $this->addSql('CREATE UNIQUE INDEX uniq_scenario_requirement_specific_character_requirement ON sf6.scenario_requirement_specific_character (requirement_specific_character_id)');
        $this->addSql('ALTER TABLE sf6.scenario_requirement_specific_character ADD CONSTRAINT fk_scenario_requirement_specific_character_context FOREIGN KEY (scenario_context_id) REFERENCES sf6.scenario_combo_context (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.scenario_requirement_specific_character ADD CONSTRAINT fk_scenario_requirement_specific_character_requirement FOREIGN KEY (requirement_specific_character_id) REFERENCES sf6.requirement_specific_character (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.scenario_requirement_specific_character DROP CONSTRAINT fk_scenario_requirement_specific_character_context');
        $this->addSql('ALTER TABLE sf6.scenario_requirement_specific_character DROP CONSTRAINT fk_scenario_requirement_specific_character_requirement');
        $this->addSql('DROP TABLE sf6.scenario_requirement_specific_character');

        $this->addSql('ALTER TABLE sf6.scenario_combo_context DROP CONSTRAINT fk_scenario_combo_context_scenario');
        $this->addSql('DROP TABLE sf6.scenario_combo_context');

        $this->addSql('ALTER TABLE sf6.requirement_specific_character ADD requirement_id INT');
        $this->addSql('UPDATE sf6.requirement_specific_character r SET requirement_id = link.combo_requirement_id FROM sf6.combo_requirement_specific_character link WHERE link.requirement_specific_character_id = r.id');
        $this->addSql('DELETE FROM sf6.requirement_specific_character WHERE requirement_id IS NULL');
        $this->addSql('ALTER TABLE sf6.requirement_specific_character ALTER requirement_id SET NOT NULL');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_A1C1D6E47B576F77 ON sf6.requirement_specific_character (requirement_id)');
        $this->addSql('ALTER TABLE sf6.requirement_specific_character ADD CONSTRAINT FK_A1C1D6E47B576F77 FOREIGN KEY (requirement_id) REFERENCES sf6.combo_requirement (id) NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('ALTER TABLE sf6.combo_requirement_specific_character DROP CONSTRAINT fk_combo_requirement_specific_character_combo');
        $this->addSql('ALTER TABLE sf6.combo_requirement_specific_character DROP CONSTRAINT fk_combo_requirement_specific_character_requirement');
        $this->addSql('DROP TABLE sf6.combo_requirement_specific_character');
    }
}
