<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260802130000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Remove Blockstring defense startup frames';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry DROP startup_frames');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry ADD startup_frames INT DEFAULT NULL');
    }
}
