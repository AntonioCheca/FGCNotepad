<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260422170000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add essential flags to scenarios and combos';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.scenario ADD is_essential BOOLEAN DEFAULT FALSE NOT NULL');
        $this->addSql('CREATE INDEX idx_scenario_is_essential ON sf6.scenario (is_essential)');

        $this->addSql('ALTER TABLE sf6.combo_sequence ADD is_essential BOOLEAN DEFAULT FALSE NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.scenario DROP is_essential');
        $this->addSql('DROP INDEX sf6.idx_scenario_is_essential');

        $this->addSql('ALTER TABLE sf6.combo_sequence DROP is_essential');
    }
}
