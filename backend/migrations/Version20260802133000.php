<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260802133000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Classify Blockstring gaps and remove gap notes';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE sf6.blockstring_gap ADD classification VARCHAR(16) DEFAULT 'safe' NOT NULL");
        $this->addSql("UPDATE sf6.blockstring_gap SET classification = CASE WHEN frames <= 2 THEN 'safe' WHEN frames = 3 THEN 'trades' ELSE 'fake' END");
        $this->addSql('ALTER TABLE sf6.blockstring_gap DROP note');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.blockstring_gap ADD note TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.blockstring_gap DROP classification');
    }
}
