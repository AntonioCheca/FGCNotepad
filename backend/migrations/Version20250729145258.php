<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20250729145258 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Changing scaling from integer to text while we still do not have the parser';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.frame_data ALTER scaling TYPE TEXT');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('CREATE SCHEMA public');
    }
}
