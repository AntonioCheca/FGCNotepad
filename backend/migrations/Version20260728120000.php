<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260728120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add sparse frame data overrides and move manual metadata';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE sf6.frame_data_override (id SERIAL NOT NULL, frame_data_id UUID NOT NULL, edited_by_id UUID DEFAULT NULL, column_name VARCHAR(64) NOT NULL, override_value JSON NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX uniq_frame_data_override_field ON sf6.frame_data_override (frame_data_id, column_name)');
        $this->addSql('CREATE INDEX idx_frame_data_override_frame_data ON sf6.frame_data_override (frame_data_id)');
        $this->addSql('CREATE INDEX idx_frame_data_override_edited_by ON sf6.frame_data_override (edited_by_id)');
        $this->addSql('ALTER TABLE sf6.frame_data_override ADD CONSTRAINT fk_frame_data_override_frame_data FOREIGN KEY (frame_data_id) REFERENCES sf6.frame_data (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.frame_data_override ADD CONSTRAINT fk_frame_data_override_edited_by FOREIGN KEY (edited_by_id) REFERENCES forum."user" (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE TABLE sf6.move_manual_metadata (id SERIAL NOT NULL, move_id UUID NOT NULL, edited_by_id UUID DEFAULT NULL, whiff_on_crouch BOOLEAN DEFAULT FALSE NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX uniq_move_manual_metadata_move ON sf6.move_manual_metadata (move_id)');
        $this->addSql('CREATE INDEX idx_move_manual_metadata_edited_by ON sf6.move_manual_metadata (edited_by_id)');
        $this->addSql('CREATE INDEX idx_move_manual_metadata_whiff ON sf6.move_manual_metadata (whiff_on_crouch)');
        $this->addSql('ALTER TABLE sf6.move_manual_metadata ADD CONSTRAINT fk_move_manual_metadata_move FOREIGN KEY (move_id) REFERENCES sf6.move (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.move_manual_metadata ADD CONSTRAINT fk_move_manual_metadata_edited_by FOREIGN KEY (edited_by_id) REFERENCES forum."user" (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.move_manual_metadata DROP CONSTRAINT fk_move_manual_metadata_edited_by');
        $this->addSql('ALTER TABLE sf6.move_manual_metadata DROP CONSTRAINT fk_move_manual_metadata_move');
        $this->addSql('ALTER TABLE sf6.frame_data_override DROP CONSTRAINT fk_frame_data_override_edited_by');
        $this->addSql('ALTER TABLE sf6.frame_data_override DROP CONSTRAINT fk_frame_data_override_frame_data');
        $this->addSql('DROP TABLE sf6.move_manual_metadata');
        $this->addSql('DROP TABLE sf6.frame_data_override');
    }
}
