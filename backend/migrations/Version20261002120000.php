<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261002120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Pressure graphs: oki node/link layers, edge kinds and outcomes; blockstrings rebuilt as node/edge graphs (local blockstring data removed)';
    }

    public function up(Schema $schema): void
    {
        // Oki keeps its node/link tables and gains the shared graph fields.
        $this->addSql('ALTER TABLE sf6.oki_node ADD layer SMALLINT DEFAULT 1 NOT NULL');
        $this->addSql('ALTER TABLE sf6.oki_node ADD damage_dealt INT DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.oki_node ADD damage_received INT DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.oki_node ADD CONSTRAINT chk_oki_node_layer CHECK (layer BETWEEN 1 AND 3)');
        $this->addSql('ALTER TABLE sf6.oki_node ADD CONSTRAINT chk_oki_node_damage CHECK ((damage_dealt IS NULL OR damage_dealt BETWEEN 1 AND 10000) AND (damage_received IS NULL OR damage_received BETWEEN 1 AND 10000))');
        $this->addSql("ALTER TABLE sf6.oki_node_link ADD kind VARCHAR(16) DEFAULT 'normal' NOT NULL");
        $this->addSql('ALTER TABLE sf6.oki_node_link ADD read_label VARCHAR(48) DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.oki_node_link ADD layer SMALLINT DEFAULT 1 NOT NULL');
        $this->addSql("ALTER TABLE sf6.oki_node_link ADD CONSTRAINT chk_oki_node_link_kind CHECK (kind IN ('normal', 'confirm', 'read', 'fake'))");
        $this->addSql("ALTER TABLE sf6.oki_node_link ADD CONSTRAINT chk_oki_node_link_read_label CHECK (read_label IS NULL OR kind = 'read')");
        $this->addSql('ALTER TABLE sf6.oki_node_link ADD CONSTRAINT chk_oki_node_link_layer CHECK (layer BETWEEN 1 AND 3)');

        // Blockstrings move from routes/adaptations/gaps to nodes + edges. No production data exists yet.
        $this->addSql('DELETE FROM sf6.blockstring_sequence');
        $this->addSql('DROP TABLE sf6.blockstring_adaptation_combo_search');
        $this->addSql('DROP TABLE sf6.blockstring_adaptation_step');
        $this->addSql('DROP TABLE sf6.blockstring_adaptation');
        $this->addSql('ALTER TABLE sf6.blockstring_route DROP CONSTRAINT fk_blockstring_route_branch_connection');
        $this->addSql('DROP TABLE sf6.blockstring_route_connection');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry DROP CONSTRAINT fk_9c5baa05fa2d9d6');
        $this->addSql('DROP INDEX sf6.idx_blockstring_defense_entry_gap');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry DROP gap_id');
        $this->addSql('DROP TABLE sf6.blockstring_gap');
        $this->addSql('ALTER TABLE sf6.blockstring_sequence_step DROP CONSTRAINT fk_blockstring_sequence_step_route');
        $this->addSql('DROP INDEX sf6.idx_blockstring_sequence_step_route');
        $this->addSql('ALTER TABLE sf6.blockstring_sequence_step DROP route_id');
        $this->addSql('DROP TABLE sf6.blockstring_route');

        $this->addSql('ALTER TABLE sf6.blockstring_sequence_step DROP can_confirm_on_hit');
        $this->addSql('ALTER TABLE sf6.blockstring_sequence_step DROP note');
        $this->addSql('ALTER TABLE sf6.blockstring_sequence_step ADD layer SMALLINT DEFAULT 1 NOT NULL');
        $this->addSql('ALTER TABLE sf6.blockstring_sequence_step ADD damage_dealt INT DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.blockstring_sequence_step ADD damage_received INT DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.blockstring_sequence_step ADD CONSTRAINT chk_blockstring_step_layer CHECK (layer BETWEEN 1 AND 3)');
        $this->addSql('ALTER TABLE sf6.blockstring_sequence_step ADD CONSTRAINT chk_blockstring_step_damage CHECK ((damage_dealt IS NULL OR damage_dealt BETWEEN 1 AND 10000) AND (damage_received IS NULL OR damage_received BETWEEN 1 AND 10000))');

        $this->addSql("CREATE TABLE sf6.blockstring_edge (id SERIAL NOT NULL, sequence_id INT NOT NULL, from_step_id INT NOT NULL, to_step_id INT NOT NULL, kind VARCHAR(16) DEFAULT 'normal' NOT NULL, read_label VARCHAR(48) DEFAULT NULL, layer SMALLINT DEFAULT 1 NOT NULL, frame_advantage SMALLINT DEFAULT NULL, gap_frames SMALLINT DEFAULT NULL, PRIMARY KEY(id))");
        $this->addSql('CREATE INDEX idx_blockstring_edge_sequence ON sf6.blockstring_edge (sequence_id)');
        $this->addSql('CREATE INDEX idx_blockstring_edge_from ON sf6.blockstring_edge (from_step_id)');
        $this->addSql('CREATE INDEX idx_blockstring_edge_to ON sf6.blockstring_edge (to_step_id)');
        $this->addSql('ALTER TABLE sf6.blockstring_edge ADD CONSTRAINT fk_blockstring_edge_sequence FOREIGN KEY (sequence_id) REFERENCES sf6.blockstring_sequence (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_edge ADD CONSTRAINT fk_blockstring_edge_from FOREIGN KEY (from_step_id) REFERENCES sf6.blockstring_sequence_step (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_edge ADD CONSTRAINT fk_blockstring_edge_to FOREIGN KEY (to_step_id) REFERENCES sf6.blockstring_sequence_step (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql("ALTER TABLE sf6.blockstring_edge ADD CONSTRAINT chk_blockstring_edge_kind CHECK (kind IN ('normal', 'confirm', 'read', 'fake'))");
        $this->addSql("ALTER TABLE sf6.blockstring_edge ADD CONSTRAINT chk_blockstring_edge_read_label CHECK (read_label IS NULL OR kind = 'read')");
        $this->addSql('ALTER TABLE sf6.blockstring_edge ADD CONSTRAINT chk_blockstring_edge_layer CHECK (layer BETWEEN 1 AND 3)');
        $this->addSql('ALTER TABLE sf6.blockstring_edge ADD CONSTRAINT chk_blockstring_edge_gap_frames CHECK (gap_frames IS NULL OR gap_frames >= 0)');

        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry ADD edge_id INT NOT NULL');
        $this->addSql('CREATE INDEX idx_blockstring_defense_entry_edge ON sf6.blockstring_defense_entry (edge_id)');
        $this->addSql('ALTER TABLE sf6.blockstring_defense_entry ADD CONSTRAINT fk_blockstring_defense_entry_edge FOREIGN KEY (edge_id) REFERENCES sf6.blockstring_edge (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->throwIrreversibleMigrationException('Blockstring routes, gaps and adaptations were removed; restore from a backup instead.');
    }
}
