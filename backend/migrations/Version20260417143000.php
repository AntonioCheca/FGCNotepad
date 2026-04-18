<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260417143000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add not_crouching_required to combo_requirement';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.combo_requirement ADD not_crouching_required BOOLEAN DEFAULT FALSE NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.combo_requirement DROP not_crouching_required');
    }
}
