<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260727173000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Remove mid-screen combo requirement flag';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_combo_requirement_mid_screen');
        $this->addSql('ALTER TABLE sf6.combo_requirement DROP mid_screen_required');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.combo_requirement ADD mid_screen_required BOOLEAN DEFAULT false NOT NULL');
        $this->addSql('CREATE INDEX idx_combo_requirement_mid_screen ON sf6.combo_requirement (mid_screen_required)');
    }
}
