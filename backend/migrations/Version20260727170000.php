<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260727170000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add side-switches requirement flag to combo requirements';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.combo_requirement ADD side_switches_required BOOLEAN DEFAULT false NOT NULL');
        $this->addSql('CREATE INDEX idx_combo_requirement_side_switches ON sf6.combo_requirement (side_switches_required)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_combo_requirement_side_switches');
        $this->addSql('ALTER TABLE sf6.combo_requirement DROP side_switches_required');
    }
}
