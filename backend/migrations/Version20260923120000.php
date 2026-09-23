<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260923120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add observed resource change (resource and delta) to combo steps';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.step_combo ADD resource_object_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.step_combo ADD resource_delta INT DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.step_combo ADD CONSTRAINT fk_step_combo_resource_object FOREIGN KEY (resource_object_id) REFERENCES sf6.character_object (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE INDEX idx_step_combo_resource_object ON sf6.step_combo (resource_object_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.step_combo DROP CONSTRAINT fk_step_combo_resource_object');
        $this->addSql('DROP INDEX sf6.idx_step_combo_resource_object');
        $this->addSql('ALTER TABLE sf6.step_combo DROP resource_object_id');
        $this->addSql('ALTER TABLE sf6.step_combo DROP resource_delta');
    }
}
