<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260923100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add FAT spacing (first number of its range text) to frame data';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.frame_data ADD spacing DOUBLE PRECISION DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.frame_data DROP spacing');
    }
}
