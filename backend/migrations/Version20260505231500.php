<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260505231500 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Persist whether scenario dynamic combo cells are attacker initiated';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.scenario_cell ADD is_combo_initiator_attacker BOOLEAN DEFAULT true NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.scenario_cell DROP is_combo_initiator_attacker');
    }
}
