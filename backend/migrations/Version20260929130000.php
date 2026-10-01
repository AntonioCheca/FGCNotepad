<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260929130000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Modern controls: move availability/notation, auto-combo mapping, combo legality, per-mode damage and profile execution mode';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.move ADD available_on_modern BOOLEAN DEFAULT TRUE NOT NULL');
        $this->addSql('ALTER TABLE sf6.move ADD modern_max_notation TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.move ADD modern_simple_notation TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.move ADD modern_simple_damage_percent SMALLINT DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.move ADD CONSTRAINT chk_move_modern_simple_damage_percent CHECK (modern_simple_damage_percent IS NULL OR modern_simple_damage_percent BETWEEN 0 AND 100)');

        $this->addSql('CREATE TABLE sf6.character_modern_auto_combo (id SERIAL NOT NULL, character_id UUID NOT NULL, combo_id INT NOT NULL, strength VARCHAR(8) NOT NULL, PRIMARY KEY(id))');
        $this->addSql("COMMENT ON COLUMN sf6.character_modern_auto_combo.character_id IS '(DC2Type:uuid)'");
        $this->addSql('CREATE UNIQUE INDEX uniq_character_modern_auto_combo_strength ON sf6.character_modern_auto_combo (character_id, strength)');
        $this->addSql('CREATE INDEX idx_character_modern_auto_combo_combo ON sf6.character_modern_auto_combo (combo_id)');
        $this->addSql("ALTER TABLE sf6.character_modern_auto_combo ADD CONSTRAINT chk_character_modern_auto_combo_strength CHECK (strength IN ('light', 'medium', 'heavy'))");
        $this->addSql('ALTER TABLE sf6.character_modern_auto_combo ADD CONSTRAINT fk_character_modern_auto_combo_character FOREIGN KEY (character_id) REFERENCES sf6."character" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.character_modern_auto_combo ADD CONSTRAINT fk_character_modern_auto_combo_combo FOREIGN KEY (combo_id) REFERENCES sf6.combo_sequence (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        // Every move starts available on Modern, so every existing combo is Modern legal with Classic-equal damage.
        $this->addSql('ALTER TABLE sf6.combo_sequence ADD modern_legal BOOLEAN DEFAULT FALSE NOT NULL');
        $this->addSql('UPDATE sf6.combo_sequence SET modern_legal = TRUE');
        $this->addSql('CREATE INDEX idx_combo_sequence_modern_legal ON sf6.combo_sequence (modern_legal)');

        $this->addSql('ALTER TABLE sf6.combo_metrics ADD modern_max_damage INT DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.combo_metrics ADD modern_simple_damage INT DEFAULT NULL');
        $this->addSql('UPDATE sf6.combo_metrics SET modern_max_damage = damage, modern_simple_damage = damage');
        $this->addSql('CREATE INDEX idx_combo_metrics_modern_max_damage ON sf6.combo_metrics (modern_max_damage)');
        $this->addSql('CREATE INDEX idx_combo_metrics_modern_simple_damage ON sf6.combo_metrics (modern_simple_damage)');

        $this->addSql("ALTER TABLE forum.user_scenario_preference ADD combo_execution_mode VARCHAR(16) DEFAULT 'classic' NOT NULL");
        $this->addSql("ALTER TABLE forum.user_scenario_preference ADD CONSTRAINT chk_user_scenario_preference_combo_execution_mode CHECK (combo_execution_mode IN ('classic', 'modern_max', 'modern_simple'))");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE forum.user_scenario_preference DROP CONSTRAINT chk_user_scenario_preference_combo_execution_mode');
        $this->addSql('ALTER TABLE forum.user_scenario_preference DROP combo_execution_mode');

        $this->addSql('DROP INDEX sf6.idx_combo_metrics_modern_simple_damage');
        $this->addSql('DROP INDEX sf6.idx_combo_metrics_modern_max_damage');
        $this->addSql('ALTER TABLE sf6.combo_metrics DROP modern_simple_damage');
        $this->addSql('ALTER TABLE sf6.combo_metrics DROP modern_max_damage');

        $this->addSql('DROP INDEX sf6.idx_combo_sequence_modern_legal');
        $this->addSql('ALTER TABLE sf6.combo_sequence DROP modern_legal');

        $this->addSql('DROP TABLE sf6.character_modern_auto_combo');

        $this->addSql('ALTER TABLE sf6.move DROP CONSTRAINT chk_move_modern_simple_damage_percent');
        $this->addSql('ALTER TABLE sf6.move DROP modern_simple_damage_percent');
        $this->addSql('ALTER TABLE sf6.move DROP modern_simple_notation');
        $this->addSql('ALTER TABLE sf6.move DROP modern_max_notation');
        $this->addSql('ALTER TABLE sf6.move DROP available_on_modern');
    }
}
