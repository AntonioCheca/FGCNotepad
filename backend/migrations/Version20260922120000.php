<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260922120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Optimize replay combo deduplication by first move';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE INDEX idx_step_combo_child_ordinal_parent ON sf6.step_combo (child_sequence_id, ordinal_in_combo, parent_sequence_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX sf6.idx_step_combo_child_ordinal_parent');
    }
}
