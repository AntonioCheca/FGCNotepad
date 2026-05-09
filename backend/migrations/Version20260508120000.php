<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260508120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add notation dictionary preference for users';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE forum.user_scenario_preference ADD notation_dictionary VARCHAR(32) DEFAULT 'numpad' NOT NULL");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE forum.user_scenario_preference DROP notation_dictionary');
    }
}
