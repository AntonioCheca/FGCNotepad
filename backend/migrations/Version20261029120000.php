<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261029120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Seen stats on scenario rows and columns: how often an imported option was observed, and over how many samples';
    }

    public function up(Schema $schema): void
    {
        foreach (['scenario_row', 'scenario_column'] as $table) {
            $this->addSql(sprintf('ALTER TABLE sf6.%s ADD seen_frequency DOUBLE PRECISION DEFAULT NULL', $table));
            $this->addSql(sprintf('ALTER TABLE sf6.%s ADD seen_sample_count INT DEFAULT NULL', $table));
            $this->addSql(sprintf(
                'ALTER TABLE sf6.%1$s ADD CONSTRAINT chk_%1$s_seen_stats CHECK ((seen_frequency IS NULL OR seen_frequency BETWEEN 0 AND 1) AND (seen_sample_count IS NULL OR seen_sample_count >= 0))',
                $table
            ));
        }
    }

    public function down(Schema $schema): void
    {
        foreach (['scenario_column', 'scenario_row'] as $table) {
            $this->addSql(sprintf('ALTER TABLE sf6.%1$s DROP CONSTRAINT chk_%1$s_seen_stats', $table));
            $this->addSql(sprintf('ALTER TABLE sf6.%s DROP seen_sample_count', $table));
            $this->addSql(sprintf('ALTER TABLE sf6.%s DROP seen_frequency', $table));
        }
    }
}
