<?php declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260726143000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add minimum drive metric columns to combo metrics';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.combo_metrics ADD minimum_drive_cost DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.combo_metrics ADD minimum_drive_cost_no_burnout DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('CREATE INDEX idx_combo_metrics_minimum_drive_cost ON sf6.combo_metrics (minimum_drive_cost)');
        $this->addSql('CREATE INDEX idx_combo_metrics_minimum_drive_cost_no_burnout ON sf6.combo_metrics (minimum_drive_cost_no_burnout)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_combo_metrics_minimum_drive_cost_no_burnout');
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_combo_metrics_minimum_drive_cost');
        $this->addSql('ALTER TABLE sf6.combo_metrics DROP minimum_drive_cost_no_burnout');
        $this->addSql('ALTER TABLE sf6.combo_metrics DROP minimum_drive_cost');
    }
}
