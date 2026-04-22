<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260422103000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add unverified delay boundary flags to combo steps';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.step_combo ADD delay_min_unverified BOOLEAN DEFAULT FALSE NOT NULL');
        $this->addSql('ALTER TABLE sf6.step_combo ADD delay_max_unverified BOOLEAN DEFAULT FALSE NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.step_combo DROP delay_min_unverified');
        $this->addSql('ALTER TABLE sf6.step_combo DROP delay_max_unverified');
    }
}
