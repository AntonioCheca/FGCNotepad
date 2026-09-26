<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260926120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add max range (spacing) to supplemental frame data values';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.frame_data_supplemental_value ADD spacing DOUBLE PRECISION DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.frame_data_supplemental_value DROP spacing');
    }
}
