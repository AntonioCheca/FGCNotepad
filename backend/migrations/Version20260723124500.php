<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260723124500 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add DR Cancel connection type';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("INSERT INTO sf6.connection_type (name) SELECT 'DR Cancel' WHERE NOT EXISTS (SELECT 1 FROM sf6.connection_type WHERE name = 'DR Cancel')");
    }

    public function down(Schema $schema): void
    {
        $this->addSql("DELETE FROM sf6.connection_type WHERE name = 'DR Cancel' AND NOT EXISTS (SELECT 1 FROM sf6.step_combo WHERE connection_type_id = sf6.connection_type.id)");
    }
}
