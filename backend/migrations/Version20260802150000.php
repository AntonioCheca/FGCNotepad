<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260802150000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add attacker frame advantage to Blockstring gaps';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.blockstring_gap ADD attacker_frame_advantage INT DEFAULT 0 NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.blockstring_gap DROP attacker_frame_advantage');
    }
}
