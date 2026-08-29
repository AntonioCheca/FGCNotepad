<?php declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260829120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add patch-aware metadata to frame-data import batches';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE sf6.frame_data_import_batch ADD source_version VARCHAR(64) DEFAULT 'legacy-unknown' NOT NULL");
        $this->addSql('ALTER TABLE sf6.frame_data_import_batch ADD source_checksum VARCHAR(64) DEFAULT NULL');
        $this->addSql("ALTER TABLE sf6.frame_data_import_batch ADD status VARCHAR(32) DEFAULT 'completed' NOT NULL");
        $this->addSql('ALTER TABLE sf6.frame_data_import_batch ADD completed_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql("UPDATE sf6.frame_data_import_batch SET source_version = 'legacy-' || TO_CHAR(imported_at, 'YYYY-MM-DD'), completed_at = imported_at, status = 'completed'");
        $this->addSql('CREATE INDEX idx_frame_data_import_batch_source_version ON sf6.frame_data_import_batch (source_type, source_version)');
        $this->addSql('CREATE INDEX idx_frame_data_import_batch_status ON sf6.frame_data_import_batch (status)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_frame_data_import_batch_status');
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_frame_data_import_batch_source_version');
        $this->addSql('ALTER TABLE sf6.frame_data_import_batch DROP completed_at');
        $this->addSql('ALTER TABLE sf6.frame_data_import_batch DROP status');
        $this->addSql('ALTER TABLE sf6.frame_data_import_batch DROP source_checksum');
        $this->addSql('ALTER TABLE sf6.frame_data_import_batch DROP source_version');
    }
}
