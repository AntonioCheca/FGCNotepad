<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260929110000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add blocked Drive Impact wall stun starter requirement to combos';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.combo_requirement ADD blocked_drive_impact_stun_required BOOLEAN DEFAULT false NOT NULL');
        $this->addSql('CREATE INDEX idx_combo_requirement_blocked_drive_impact_stun ON sf6.combo_requirement (blocked_drive_impact_stun_required)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX sf6.idx_combo_requirement_blocked_drive_impact_stun');
        $this->addSql('ALTER TABLE sf6.combo_requirement DROP blocked_drive_impact_stun_required');
    }
}
