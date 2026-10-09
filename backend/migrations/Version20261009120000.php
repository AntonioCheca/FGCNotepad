<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261009120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Stores the notation a combo was last filled from, so editors can re-run Fill Details';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.combo_sequence ADD input_notation TEXT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.combo_sequence DROP input_notation');
    }
}
