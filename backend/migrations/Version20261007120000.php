<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261007120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Oki simplification: universal action nodes, hit level and side switch medals, explicit ender steps with safe jump/recovery medals, backroll-dependent setups; drops option types, properties, interactions, damage, frame windows and setup flags';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('DROP TABLE sf6.oki_node_property');
        $this->addSql('DROP TABLE sf6.oki_option_interaction');

        $this->addSql('ALTER TABLE sf6.oki_node DROP CONSTRAINT chk_oki_node_option_type');
        $this->addSql('ALTER TABLE sf6.oki_node DROP CONSTRAINT chk_oki_node_damage');
        $this->addSql('DROP INDEX sf6.idx_oki_node_option_type');
        $this->addSql('ALTER TABLE sf6.oki_node DROP is_default_route, DROP route_explanation, DROP option_type, DROP damage_dealt, DROP damage_received');
        $this->addSql('ALTER TABLE sf6.oki_node ALTER move_id DROP NOT NULL');
        $this->addSql('ALTER TABLE sf6.oki_node ADD action VARCHAR(24) DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.oki_node ADD hit_level VARCHAR(16) DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.oki_node ADD side_switch BOOLEAN DEFAULT false NOT NULL');
        $this->addSql('ALTER TABLE sf6.oki_node ADD CONSTRAINT chk_oki_node_move_or_action CHECK ((move_id IS NULL) <> (action IS NULL))');
        $this->addSql("ALTER TABLE sf6.oki_node ADD CONSTRAINT chk_oki_node_action CHECK (action IS NULL OR action IN ('BLOCK', 'SHIMMY', 'NEUTRAL_JUMP', 'FORWARD_JUMP', 'BACK_JUMP', 'BACKDASH'))");
        $this->addSql("ALTER TABLE sf6.oki_node ADD CONSTRAINT chk_oki_node_hit_level CHECK (hit_level IS NULL OR hit_level IN ('LOW', 'OVERHEAD'))");

        $this->addSql('ALTER TABLE sf6.oki_node_link DROP CONSTRAINT chk_oki_node_link_frame_window');
        $this->addSql('ALTER TABLE sf6.oki_node_link DROP CONSTRAINT chk_oki_node_link_step_type');
        $this->addSql('ALTER TABLE sf6.oki_node_link DROP CONSTRAINT chk_oki_node_link_layer');
        $this->addSql('ALTER TABLE sf6.oki_node_link DROP min_frames, DROP max_frames, DROP layer');
        $this->addSql("UPDATE sf6.oki_node_link SET step_type = 'DELAY' WHERE step_type = 'WAIT'");
        $this->addSql("ALTER TABLE sf6.oki_node_link ADD CONSTRAINT chk_oki_node_link_step_type CHECK (step_type IN ('IMMEDIATE', 'WALK_FORWARD', 'WALK_BACKWARD', 'FORWARD_DASH', 'DELAY', 'DRIVE_RUSH_CANCEL'))");
        $this->addSql('ALTER TABLE sf6.oki_node_link ALTER from_node_id DROP NOT NULL');
        $this->addSql('ALTER TABLE sf6.oki_node_link ADD safe_jump VARCHAR(16) DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.oki_node_link ADD recovery VARCHAR(16) DEFAULT NULL');
        $this->addSql("ALTER TABLE sf6.oki_node_link ADD CONSTRAINT chk_oki_node_link_safe_jump CHECK (safe_jump IS NULL OR safe_jump IN ('SAFE', 'FAKE'))");
        $this->addSql("ALTER TABLE sf6.oki_node_link ADD CONSTRAINT chk_oki_node_link_recovery CHECK (recovery IS NULL OR recovery IN ('BACKROLL', 'RISE_IN_PLACE'))");
        // Steps from the ender used to be implied for every node without an incoming link; they are now stored.
        $this->addSql("INSERT INTO sf6.oki_node_link (from_node_id, to_node_id, step_type, kind) SELECT NULL, node.id, 'IMMEDIATE', 'normal' FROM sf6.oki_node node WHERE NOT EXISTS (SELECT 1 FROM sf6.oki_node_link link WHERE link.to_node_id = node.id)");

        $this->addSql('ALTER TABLE sf6.oki_setup DROP uses_drive_rush, DROP auto_timed, DROP works_no_backroll, DROP works_backroll, DROP fake_no_backroll, DROP fake_backroll');
        $this->addSql('ALTER TABLE sf6.oki_setup ADD backroll_dependent BOOLEAN DEFAULT false NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->throwIrreversibleMigrationException('Dropped oki option types, properties, interactions, damage and setup flags cannot be restored.');
    }
}
