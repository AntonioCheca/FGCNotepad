<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261007180000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Oki/Blockstring refinement: move common names, named oki setups, walk nodes, no layers, Immediate/Delay steps only, safe jump flag; blockstring blocks, starting move, node frame advantage, true blockstring edges; drops blockstring status, summary, damage, defense entries and conditions';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.move ADD common_name TEXT DEFAULT NULL');
        $this->addSql("UPDATE sf6.move SET common_name = 'Forward Dash' WHERE numpad_notation = '66'");
        $this->addSql("UPDATE sf6.move SET common_name = 'Back Dash' WHERE numpad_notation = '44'");

        $this->upOki();
        $this->upBlockstrings();
    }

    private function upOki(): void
    {
        $this->addSql('ALTER TABLE sf6.oki_setup ADD name VARCHAR(80) DEFAULT NULL');
        $this->addSql("UPDATE sf6.oki_setup setup SET name = 'Setup ' || ranked.position FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY oki_profile_id ORDER BY id) AS position FROM sf6.oki_setup) ranked WHERE ranked.id = setup.id");
        $this->addSql('ALTER TABLE sf6.oki_setup ALTER name SET NOT NULL');

        $this->addSql('ALTER TABLE sf6.oki_node DROP CONSTRAINT chk_oki_node_layer');
        $this->addSql('ALTER TABLE sf6.oki_node DROP layer');
        $this->addSql('ALTER TABLE sf6.oki_node DROP CONSTRAINT chk_oki_node_action');
        $this->addSql("ALTER TABLE sf6.oki_node ADD CONSTRAINT chk_oki_node_action CHECK (action IS NULL OR action IN ('BLOCK', 'SHIMMY', 'WALK_FORWARD', 'WALK_BACKWARD', 'NEUTRAL_JUMP', 'FORWARD_JUMP', 'BACK_JUMP', 'BACKDASH'))");

        $this->addSql('ALTER TABLE sf6.oki_node_link DROP CONSTRAINT chk_oki_node_link_step_type');
        $this->addSql("UPDATE sf6.oki_node_link SET step_type = 'IMMEDIATE' WHERE step_type NOT IN ('IMMEDIATE', 'DELAY')");
        $this->addSql("ALTER TABLE sf6.oki_node_link ADD CONSTRAINT chk_oki_node_link_step_type CHECK (step_type IN ('IMMEDIATE', 'DELAY'))");

        // Oki has no fake arrows: a deliberately fake route is a hard read on a passive opponent.
        $this->addSql('ALTER TABLE sf6.oki_node_link DROP CONSTRAINT chk_oki_node_link_kind');
        $this->addSql("UPDATE sf6.oki_node_link SET kind = 'read' WHERE kind = 'fake'");
        $this->addSql("ALTER TABLE sf6.oki_node_link ADD CONSTRAINT chk_oki_node_link_kind CHECK (kind IN ('normal', 'confirm', 'read'))");

        $this->addSql('ALTER TABLE sf6.oki_node_link DROP CONSTRAINT chk_oki_node_link_safe_jump');
        $this->addSql('ALTER TABLE sf6.oki_node_link ALTER safe_jump DROP DEFAULT');
        $this->addSql("ALTER TABLE sf6.oki_node_link ALTER safe_jump TYPE BOOLEAN USING (safe_jump IS NOT DISTINCT FROM 'SAFE')");
        $this->addSql('ALTER TABLE sf6.oki_node_link ALTER safe_jump SET DEFAULT false');
        $this->addSql('ALTER TABLE sf6.oki_node_link ALTER safe_jump SET NOT NULL');
    }

    private function upBlockstrings(): void
    {
        $this->addSql('DROP TABLE sf6.blockstring_defense_entry');
        $this->addSql('DROP TABLE sf6.blockstring_condition');

        $this->addSql('CREATE TABLE sf6.blockstring_block (id SERIAL NOT NULL, sequence_id INT NOT NULL, ordinal SMALLINT NOT NULL, description TEXT DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_blockstring_block_sequence ON sf6.blockstring_block (sequence_id, ordinal)');
        $this->addSql('ALTER TABLE sf6.blockstring_block ADD CONSTRAINT fk_blockstring_block_sequence FOREIGN KEY (sequence_id) REFERENCES sf6.blockstring_sequence (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('INSERT INTO sf6.blockstring_block (sequence_id, ordinal) SELECT id, 1 FROM sf6.blockstring_sequence');

        $this->addSql('ALTER TABLE sf6.blockstring_sequence_step ADD block_id INT DEFAULT NULL');
        $this->addSql('UPDATE sf6.blockstring_sequence_step step SET block_id = block.id FROM sf6.blockstring_block block WHERE block.sequence_id = step.sequence_id');
        $this->addSql('ALTER TABLE sf6.blockstring_sequence_step ALTER block_id SET NOT NULL');
        $this->addSql('ALTER TABLE sf6.blockstring_sequence_step ADD CONSTRAINT fk_blockstring_step_block FOREIGN KEY (block_id) REFERENCES sf6.blockstring_block (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE INDEX idx_blockstring_sequence_step_block ON sf6.blockstring_sequence_step (block_id)');

        // Frame advantage used to sit on the outgoing arrows; it belongs to the move the arrows leave from.
        $this->addSql('ALTER TABLE sf6.blockstring_sequence_step ADD frame_advantage SMALLINT DEFAULT NULL');
        $this->addSql('UPDATE sf6.blockstring_sequence_step step SET frame_advantage = (SELECT edge.frame_advantage FROM sf6.blockstring_edge edge WHERE edge.from_step_id = step.id AND edge.frame_advantage IS NOT NULL ORDER BY edge.id LIMIT 1)');
        $this->addSql('ALTER TABLE sf6.blockstring_sequence_step DROP CONSTRAINT chk_blockstring_step_layer');
        $this->addSql('ALTER TABLE sf6.blockstring_sequence_step DROP CONSTRAINT chk_blockstring_step_damage');
        $this->addSql('ALTER TABLE sf6.blockstring_sequence_step DROP layer, DROP damage_dealt, DROP damage_received');

        $this->addSql('ALTER TABLE sf6.blockstring_edge DROP CONSTRAINT chk_blockstring_edge_layer');
        $this->addSql('ALTER TABLE sf6.blockstring_edge DROP layer, DROP frame_advantage');
        $this->addSql('ALTER TABLE sf6.blockstring_edge ADD true_blockstring BOOLEAN DEFAULT false NOT NULL');
        $this->addSql('ALTER TABLE sf6.blockstring_edge ADD CONSTRAINT chk_blockstring_edge_true_or_gap CHECK (NOT true_blockstring OR gap_frames IS NULL)');

        $this->addSql('ALTER TABLE sf6.blockstring_sequence ADD starting_move_id UUID DEFAULT NULL');
        $this->addSql('UPDATE sf6.blockstring_sequence sequence SET starting_move_id = (SELECT step.move_id FROM sf6.blockstring_sequence_step step WHERE step.sequence_id = sequence.id ORDER BY step.ordinal, step.id LIMIT 1)');
        $this->addSql('ALTER TABLE sf6.blockstring_sequence ALTER starting_move_id SET NOT NULL');
        $this->addSql('ALTER TABLE sf6.blockstring_sequence ADD CONSTRAINT fk_blockstring_sequence_starting_move FOREIGN KEY (starting_move_id) REFERENCES sf6.move (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE INDEX idx_blockstring_sequence_starting_move ON sf6.blockstring_sequence (starting_move_id)');
        $this->addSql('DROP INDEX sf6.idx_blockstring_sequence_classification');
        $this->addSql('ALTER TABLE sf6.blockstring_sequence DROP classification, DROP summary');
    }

    public function down(Schema $schema): void
    {
        $this->throwIrreversibleMigrationException('Dropped blockstring defense entries, conditions, status, summaries, damage and layers cannot be restored.');
    }
}
