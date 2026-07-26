<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260726120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Rename Blockstun scenario type to Blockstring';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("UPDATE sf6.scenario SET scenario_type = 'blockstring' WHERE scenario_type = 'blockstun'");
        $this->addSql(<<<'SQL'
DO $$
DECLARE
    blockstring_id INT;
BEGIN
    SELECT id INTO blockstring_id FROM sf6.scenario_type WHERE name = 'Blockstring' ORDER BY id LIMIT 1;

    IF blockstring_id IS NULL THEN
        UPDATE sf6.scenario_type
        SET name = 'Blockstring'
        WHERE id = (SELECT id FROM sf6.scenario_type WHERE name = 'Blockstun' ORDER BY id LIMIT 1)
        RETURNING id INTO blockstring_id;
    END IF;

    IF blockstring_id IS NOT NULL THEN
        UPDATE sf6.scenario
        SET type_id = blockstring_id
        WHERE type_id IN (SELECT id FROM sf6.scenario_type WHERE name = 'Blockstun');

        DELETE FROM sf6.scenario_type WHERE name = 'Blockstun';
    END IF;
END $$;
SQL);
    }

    public function down(Schema $schema): void
    {
        $this->addSql("UPDATE sf6.scenario SET scenario_type = 'blockstun' WHERE scenario_type = 'blockstring'");
        $this->addSql(<<<'SQL'
DO $$
DECLARE
    blockstring_id INT;
    blockstun_id INT;
BEGIN
    SELECT id INTO blockstring_id FROM sf6.scenario_type WHERE name = 'Blockstring' ORDER BY id LIMIT 1;
    SELECT id INTO blockstun_id FROM sf6.scenario_type WHERE name = 'Blockstun' ORDER BY id LIMIT 1;

    IF blockstun_id IS NULL THEN
        UPDATE sf6.scenario_type
        SET name = 'Blockstun'
        WHERE id = blockstring_id
        RETURNING id INTO blockstun_id;
    END IF;

    IF blockstun_id IS NOT NULL THEN
        UPDATE sf6.scenario
        SET type_id = blockstun_id
        WHERE type_id IN (SELECT id FROM sf6.scenario_type WHERE name = 'Blockstring');

        DELETE FROM sf6.scenario_type WHERE name = 'Blockstring';
    END IF;
END $$;
SQL);
    }
}
