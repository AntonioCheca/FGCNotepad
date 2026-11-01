<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261028120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Supports scenario_export_v1 import/export: external import key + content hash and knockdown advantage on scenarios, row/column descriptions, per-cell provenance';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.scenario ADD knockdown_advantage SMALLINT DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.scenario ADD import_source VARCHAR(64) DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.scenario ADD import_external_id VARCHAR(191) DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.scenario ADD import_content_hash VARCHAR(64) DEFAULT NULL');
        $this->addSql('CREATE UNIQUE INDEX uniq_scenario_import_key ON sf6.scenario (import_source, import_external_id)');

        $this->addSql('ALTER TABLE sf6.scenario_row ADD description TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.scenario_column ADD description TEXT DEFAULT NULL');

        $this->addSql('ALTER TABLE sf6.scenario_cell ADD provenance_status VARCHAR(16) DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.scenario_cell ADD provenance_sample_count INT DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.scenario_cell ADD provenance_confidence DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.scenario_cell ADD provenance_note VARCHAR(500) DEFAULT NULL');
        $this->addSql("ALTER TABLE sf6.scenario_cell ADD CONSTRAINT chk_scenario_cell_provenance_status CHECK (provenance_status IS NULL OR provenance_status IN ('observed', 'inferred', 'disputed'))");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.scenario_cell DROP CONSTRAINT chk_scenario_cell_provenance_status');
        $this->addSql('ALTER TABLE sf6.scenario_cell DROP provenance_note');
        $this->addSql('ALTER TABLE sf6.scenario_cell DROP provenance_confidence');
        $this->addSql('ALTER TABLE sf6.scenario_cell DROP provenance_sample_count');
        $this->addSql('ALTER TABLE sf6.scenario_cell DROP provenance_status');

        $this->addSql('ALTER TABLE sf6.scenario_column DROP description');
        $this->addSql('ALTER TABLE sf6.scenario_row DROP description');

        $this->addSql('DROP INDEX sf6.uniq_scenario_import_key');
        $this->addSql('ALTER TABLE sf6.scenario DROP import_content_hash');
        $this->addSql('ALTER TABLE sf6.scenario DROP import_external_id');
        $this->addSql('ALTER TABLE sf6.scenario DROP import_source');
        $this->addSql('ALTER TABLE sf6.scenario DROP knockdown_advantage');
    }
}
