<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260726133000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Persist resource-adjusted combo damage and add combo search sort indexes';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE EXTENSION IF NOT EXISTS pg_trgm');
        $this->addSql('ALTER TABLE sf6.combo_metrics ADD resource_adjusted_damage DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('UPDATE sf6.combo_metrics SET resource_adjusted_damage = damage - (((COALESCE(drive_cost, 0) - COALESCE(drive_gain, 0)) * 200.0)) - (((COALESCE(super_cost, 0) - COALESCE(super_gain, 0)) * 500.0)) WHERE damage IS NOT NULL');
        $this->addSql('CREATE INDEX idx_combo_metrics_resource_adjusted_damage ON sf6.combo_metrics (resource_adjusted_damage)');
        $this->addSql('CREATE INDEX idx_combo_metrics_damage ON sf6.combo_metrics (damage)');
        $this->addSql('CREATE INDEX idx_combo_metrics_difficulty_level ON sf6.combo_metrics (difficulty_level)');
        $this->addSql('CREATE INDEX idx_combo_metrics_drive_cost ON sf6.combo_metrics (drive_cost)');
        $this->addSql('CREATE INDEX idx_combo_metrics_super_cost ON sf6.combo_metrics (super_cost)');
        $this->addSql('CREATE INDEX idx_combo_metrics_drive_gain ON sf6.combo_metrics (drive_gain)');
        $this->addSql('CREATE INDEX idx_combo_metrics_super_gain ON sf6.combo_metrics (super_gain)');
        $this->addSql('CREATE INDEX idx_step_combo_parent_ordinal_child ON sf6.step_combo (parent_sequence_id, ordinal_in_combo, child_sequence_id)');
        $this->addSql('CREATE INDEX idx_requirement_specific_character_object_status ON sf6.requirement_specific_character (object_name, status_required)');
        $this->addSql('CREATE INDEX idx_season_start_date ON sf6.season (start_date)');
        $this->addSql('CREATE INDEX idx_combo_sequence_name_trgm ON sf6.combo_sequence USING GIN (LOWER(name) gin_trgm_ops)');
        $this->addSql('CREATE INDEX idx_combo_sequence_is_essential ON sf6.combo_sequence (is_essential)');
        $this->addSql('CREATE INDEX idx_combo_requirement_counter_hit ON sf6.combo_requirement (counter_hit_required)');
        $this->addSql('CREATE INDEX idx_combo_requirement_punish_counter ON sf6.combo_requirement (punish_counter_required)');
        $this->addSql('CREATE INDEX idx_combo_requirement_corner ON sf6.combo_requirement (corner_required)');
        $this->addSql('CREATE INDEX idx_combo_requirement_airborne ON sf6.combo_requirement (airborne_required)');
        $this->addSql('CREATE INDEX idx_combo_requirement_mid_screen ON sf6.combo_requirement (mid_screen_required)');
        $this->addSql('CREATE INDEX idx_combo_requirement_not_crouching ON sf6.combo_requirement (not_crouching_required)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_combo_sequence_name_trgm');
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_combo_requirement_not_crouching');
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_combo_requirement_mid_screen');
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_combo_requirement_airborne');
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_combo_requirement_corner');
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_combo_requirement_punish_counter');
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_combo_requirement_counter_hit');
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_combo_sequence_is_essential');
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_season_start_date');
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_requirement_specific_character_object_status');
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_step_combo_parent_ordinal_child');
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_combo_metrics_super_gain');
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_combo_metrics_drive_gain');
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_combo_metrics_super_cost');
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_combo_metrics_drive_cost');
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_combo_metrics_difficulty_level');
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_combo_metrics_damage');
        $this->addSql('DROP INDEX IF EXISTS sf6.idx_combo_metrics_resource_adjusted_damage');
        $this->addSql('ALTER TABLE sf6.combo_metrics DROP resource_adjusted_damage');
    }
}
