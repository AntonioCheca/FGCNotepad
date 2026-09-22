<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260922130000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add perfect parry starter requirement to combo requirements';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.combo_requirement ADD perfect_parry_required BOOLEAN DEFAULT false NOT NULL');
        $this->addSql('CREATE INDEX idx_combo_requirement_perfect_parry ON sf6.combo_requirement (perfect_parry_required)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX sf6.idx_combo_requirement_perfect_parry');
        $this->addSql('ALTER TABLE sf6.combo_requirement DROP perfect_parry_required');
    }
}
