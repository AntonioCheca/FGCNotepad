<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260427120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add resource cost metrics to combo metrics';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.combo_metrics ADD drive_cost DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.combo_metrics ADD drive_gain DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.combo_metrics ADD super_cost DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.combo_metrics ADD super_gain DOUBLE PRECISION DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.combo_metrics DROP drive_cost');
        $this->addSql('ALTER TABLE sf6.combo_metrics DROP drive_gain');
        $this->addSql('ALTER TABLE sf6.combo_metrics DROP super_cost');
        $this->addSql('ALTER TABLE sf6.combo_metrics DROP super_gain');
    }
}
