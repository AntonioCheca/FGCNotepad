<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260730123000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Allow unavailable oki frame advantage when move on-hit frame data is missing';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.oki_profile ALTER frame_advantage DROP NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('UPDATE sf6.oki_profile SET frame_advantage = 0 WHERE frame_advantage IS NULL');
        $this->addSql('ALTER TABLE sf6.oki_profile ALTER frame_advantage SET NOT NULL');
    }
}
