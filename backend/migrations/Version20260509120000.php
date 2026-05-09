<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260509120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add normalized scaling columns for frame data parser output';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.frame_data ADD scaling_start_percent SMALLINT DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.frame_data ADD scaling_immediate_percent SMALLINT DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.frame_data ADD scaling_minimum_percent SMALLINT DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.frame_data ADD scaling_combo_hits SMALLINT DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.frame_data ADD scaling_combo_extra_percent SMALLINT DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.frame_data ADD scaling_multiplier_percent SMALLINT DEFAULT NULL');
        $this->addSql("ALTER TABLE sf6.frame_data ADD scaling_parse_status VARCHAR(32) DEFAULT 'parsed' NOT NULL");
        $this->addSql('ALTER TABLE sf6.frame_data ADD scaling_parse_note TEXT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.frame_data DROP scaling_start_percent');
        $this->addSql('ALTER TABLE sf6.frame_data DROP scaling_immediate_percent');
        $this->addSql('ALTER TABLE sf6.frame_data DROP scaling_minimum_percent');
        $this->addSql('ALTER TABLE sf6.frame_data DROP scaling_combo_hits');
        $this->addSql('ALTER TABLE sf6.frame_data DROP scaling_combo_extra_percent');
        $this->addSql('ALTER TABLE sf6.frame_data DROP scaling_multiplier_percent');
        $this->addSql('ALTER TABLE sf6.frame_data DROP scaling_parse_status');
        $this->addSql('ALTER TABLE sf6.frame_data DROP scaling_parse_note');
    }
}
