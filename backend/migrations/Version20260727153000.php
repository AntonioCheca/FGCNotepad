<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260727153000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Rename combo object state tables and add character object catalog with consumed/added state fields';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE sf6.character_object (id SERIAL NOT NULL, character_name TEXT NOT NULL, object_key TEXT NOT NULL, name TEXT NOT NULL, status_type VARCHAR(16) NOT NULL, max_status INT DEFAULT NULL, can_be_consumed BOOLEAN DEFAULT false NOT NULL, can_be_added_relative BOOLEAN DEFAULT false NOT NULL, can_be_added_absolute BOOLEAN DEFAULT false NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX uniq_character_object_key ON sf6.character_object (object_key)');
        $this->addSql('CREATE INDEX idx_character_object_character_name ON sf6.character_object (character_name)');

        foreach ($this->characterObjectRows() as $row) {
            $this->addSql(sprintf(
                "INSERT INTO sf6.character_object (character_name, object_key, name, status_type, max_status, can_be_consumed, can_be_added_relative, can_be_added_absolute) VALUES ('%s', '%s', '%s', '%s', %s, %s, %s, %s)",
                str_replace("'", "''", $row['character_name']),
                str_replace("'", "''", $row['object_key']),
                str_replace("'", "''", $row['name']),
                $row['status_type'],
                null === $row['max_status'] ? 'NULL' : (string) $row['max_status'],
                $row['can_be_consumed'] ? 'true' : 'false',
                $row['can_be_added_relative'] ? 'true' : 'false',
                $row['can_be_added_absolute'] ? 'true' : 'false',
            ));
        }

        $this->addSql('DROP INDEX IF EXISTS sf6.idx_requirement_specific_character_object_status');
        $this->addSql('ALTER TABLE sf6.requirement_specific_character RENAME TO character_object_state');
        $this->addSql('ALTER SEQUENCE IF EXISTS sf6.requirement_specific_character_id_seq RENAME TO character_object_state_id_seq');
        $this->addSql("ALTER TABLE sf6.character_object_state ALTER id SET DEFAULT nextval('sf6.character_object_state_id_seq')");
        $this->addSql('ALTER TABLE sf6.combo_requirement_specific_character RENAME TO combo_requirement_object_state');
        $this->addSql('ALTER TABLE sf6.combo_requirement_object_state RENAME COLUMN requirement_specific_character_id TO character_object_state_id');
        $this->addSql('ALTER TABLE sf6.scenario_requirement_specific_character RENAME TO scenario_character_object_state');
        $this->addSql('ALTER TABLE sf6.scenario_character_object_state RENAME COLUMN requirement_specific_character_id TO character_object_state_id');

        $this->addSql('ALTER TABLE sf6.character_object_state ADD character_object_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.character_object_state ADD character_name TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.character_object_state ADD object_key TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.character_object_state ALTER status_required DROP NOT NULL');
        $this->addSql('ALTER TABLE sf6.character_object_state ADD consumed BOOLEAN DEFAULT false NOT NULL');
        $this->addSql('ALTER TABLE sf6.character_object_state ADD added_relative TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.character_object_state ADD added_absolute TEXT DEFAULT NULL');

        $this->addSql("UPDATE sf6.character_object_state SET object_key = CASE object_name WHEN 'Drinks' THEN 'jamie_drinks' WHEN 'Medals' THEN 'manon_medals' WHEN 'Sumo Spirit' THEN 'ehonda_sumo_spirit' WHEN 'Poison' THEN 'aki_poison' WHEN 'Bomb' THEN 'bison_bomb' WHEN 'Fire Fans' THEN 'mai_fire_fans' WHEN 'Wind Charge' THEN 'rashid_wind_charge' WHEN 'Fuha' THEN 'juri_fuha' WHEN 'Bushin Ninjastar Cypher (Kim''s Level 3)' THEN 'kimberly_install' WHEN 'Denjin Charge' THEN 'ryu_denjin_charge' ELSE NULL END");
        $this->addSql('UPDATE sf6.character_object_state state SET character_object_id = object.id, character_name = object.character_name, object_name = object.name FROM sf6.character_object object WHERE state.object_key = object.object_key');
        $this->addSql('ALTER TABLE sf6.character_object_state ADD CONSTRAINT fk_character_object_state_object FOREIGN KEY (character_object_id) REFERENCES sf6.character_object (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE INDEX idx_character_object_state_object_required ON sf6.character_object_state (object_name, status_required)');
        $this->addSql('CREATE INDEX idx_character_object_state_object_added_relative ON sf6.character_object_state (object_name, added_relative)');
        $this->addSql('CREATE INDEX idx_character_object_state_object_added_absolute ON sf6.character_object_state (object_name, added_absolute)');
        $this->addSql('CREATE INDEX idx_character_object_state_catalog ON sf6.character_object_state (character_object_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_character_object_state_catalog');
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_character_object_state_object_added_absolute');
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_character_object_state_object_added_relative');
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_character_object_state_object_required');
        $this->addSql('ALTER TABLE sf6.character_object_state DROP CONSTRAINT IF EXISTS fk_character_object_state_object');
        $this->addSql("UPDATE sf6.character_object_state SET status_required = 'true' WHERE status_required IS NULL");
        $this->addSql('ALTER TABLE sf6.character_object_state ALTER status_required SET NOT NULL');
        $this->addSql('ALTER TABLE sf6.character_object_state DROP added_absolute');
        $this->addSql('ALTER TABLE sf6.character_object_state DROP added_relative');
        $this->addSql('ALTER TABLE sf6.character_object_state DROP consumed');
        $this->addSql('ALTER TABLE sf6.character_object_state DROP object_key');
        $this->addSql('ALTER TABLE sf6.character_object_state DROP character_name');
        $this->addSql('ALTER TABLE sf6.character_object_state DROP character_object_id');

        $this->addSql('ALTER TABLE sf6.scenario_character_object_state RENAME COLUMN character_object_state_id TO requirement_specific_character_id');
        $this->addSql('ALTER TABLE sf6.scenario_character_object_state RENAME TO scenario_requirement_specific_character');
        $this->addSql('ALTER TABLE sf6.combo_requirement_object_state RENAME COLUMN character_object_state_id TO requirement_specific_character_id');
        $this->addSql('ALTER TABLE sf6.combo_requirement_object_state RENAME TO combo_requirement_specific_character');
        $this->addSql('ALTER TABLE sf6.character_object_state RENAME TO requirement_specific_character');
        $this->addSql('ALTER SEQUENCE IF EXISTS sf6.character_object_state_id_seq RENAME TO requirement_specific_character_id_seq');
        $this->addSql("ALTER TABLE sf6.requirement_specific_character ALTER id SET DEFAULT nextval('sf6.requirement_specific_character_id_seq')");
        $this->addSql('CREATE INDEX idx_requirement_specific_character_object_status ON sf6.requirement_specific_character (object_name, status_required)');

        $this->addSql('DROP TABLE sf6.character_object');
    }

    /** @return list<array{character_name:string,object_key:string,name:string,status_type:string,max_status:int|null,can_be_consumed:bool,can_be_added_relative:bool,can_be_added_absolute:bool}> */
    private function characterObjectRows(): array
    {
        return [
            ['character_name' => 'Jamie', 'object_key' => 'jamie_drinks', 'name' => 'Drinks', 'status_type' => 'integer', 'max_status' => 4, 'can_be_consumed' => false, 'can_be_added_relative' => true, 'can_be_added_absolute' => false],
            ['character_name' => 'Manon', 'object_key' => 'manon_medals', 'name' => 'Medals', 'status_type' => 'integer', 'max_status' => 5, 'can_be_consumed' => false, 'can_be_added_relative' => true, 'can_be_added_absolute' => false],
            ['character_name' => 'E. Honda', 'object_key' => 'ehonda_sumo_spirit', 'name' => 'Sumo Spirit', 'status_type' => 'boolean', 'max_status' => null, 'can_be_consumed' => true, 'can_be_added_relative' => true, 'can_be_added_absolute' => false],
            ['character_name' => 'A.K.I.', 'object_key' => 'aki_poison', 'name' => 'Poison', 'status_type' => 'boolean', 'max_status' => null, 'can_be_consumed' => true, 'can_be_added_relative' => true, 'can_be_added_absolute' => false],
            ['character_name' => 'M. Bison', 'object_key' => 'bison_bomb', 'name' => 'Bomb', 'status_type' => 'boolean', 'max_status' => null, 'can_be_consumed' => true, 'can_be_added_relative' => true, 'can_be_added_absolute' => false],
            ['character_name' => 'Mai', 'object_key' => 'mai_fire_fans', 'name' => 'Fire Fans', 'status_type' => 'integer', 'max_status' => 5, 'can_be_consumed' => true, 'can_be_added_relative' => false, 'can_be_added_absolute' => true],
            ['character_name' => 'Rashid', 'object_key' => 'rashid_wind_charge', 'name' => 'Wind Charge', 'status_type' => 'integer', 'max_status' => 3, 'can_be_consumed' => true, 'can_be_added_relative' => true, 'can_be_added_absolute' => false],
            ['character_name' => 'Juri', 'object_key' => 'juri_fuha', 'name' => 'Fuha', 'status_type' => 'integer', 'max_status' => 3, 'can_be_consumed' => true, 'can_be_added_relative' => true, 'can_be_added_absolute' => false],
            ['character_name' => 'Kimberly', 'object_key' => 'kimberly_install', 'name' => 'Install', 'status_type' => 'boolean', 'max_status' => null, 'can_be_consumed' => false, 'can_be_added_relative' => true, 'can_be_added_absolute' => false],
            ['character_name' => 'Kimberly', 'object_key' => 'kimberly_spray_cans', 'name' => 'Spray Cans', 'status_type' => 'integer', 'max_status' => 2, 'can_be_consumed' => true, 'can_be_added_relative' => false, 'can_be_added_absolute' => true],
            ['character_name' => 'Ryu', 'object_key' => 'ryu_denjin_charge', 'name' => 'Denjin Charge', 'status_type' => 'boolean', 'max_status' => null, 'can_be_consumed' => true, 'can_be_added_relative' => true, 'can_be_added_absolute' => false],
            ['character_name' => 'C. Viper', 'object_key' => 'viper_install', 'name' => 'Install', 'status_type' => 'boolean', 'max_status' => null, 'can_be_consumed' => false, 'can_be_added_relative' => true, 'can_be_added_absolute' => false],
        ];
    }
}
