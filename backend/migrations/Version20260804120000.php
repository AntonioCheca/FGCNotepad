<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260804120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add blockstring route swimlanes and route connection metadata';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE sf6.blockstring_route (id SERIAL NOT NULL, sequence_id INT NOT NULL, branch_anchor_step_id INT DEFAULT NULL, branch_anchor_connection_id INT DEFAULT NULL, name TEXT NOT NULL, display_order SMALLINT DEFAULT 1 NOT NULL, is_main BOOLEAN DEFAULT false NOT NULL, tactical_reason_text TEXT DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_blockstring_route_sequence ON sf6.blockstring_route (sequence_id, display_order)');
        $this->addSql('CREATE INDEX idx_blockstring_route_branch_step ON sf6.blockstring_route (branch_anchor_step_id)');
        $this->addSql('CREATE INDEX idx_blockstring_route_branch_connection ON sf6.blockstring_route (branch_anchor_connection_id)');
        $this->addSql('ALTER TABLE sf6.blockstring_route ADD CONSTRAINT FK_BLOCKSTRING_ROUTE_SEQUENCE FOREIGN KEY (sequence_id) REFERENCES sf6.blockstring_sequence (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_route ADD CONSTRAINT FK_BLOCKSTRING_ROUTE_BRANCH_STEP FOREIGN KEY (branch_anchor_step_id) REFERENCES sf6.blockstring_sequence_step (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('ALTER TABLE sf6.blockstring_sequence_step ADD route_id INT DEFAULT NULL');
        $this->addSql('CREATE INDEX idx_blockstring_sequence_step_route ON sf6.blockstring_sequence_step (route_id, ordinal)');

        $this->addSql("INSERT INTO sf6.blockstring_route (sequence_id, name, display_order, is_main, tactical_reason_text) SELECT id, 'Main route', 1, true, NULL FROM sf6.blockstring_sequence");
        $this->addSql('UPDATE sf6.blockstring_sequence_step step SET route_id = route.id FROM sf6.blockstring_route route WHERE route.sequence_id = step.sequence_id AND route.is_main = true');
        $this->addSql('ALTER TABLE sf6.blockstring_sequence_step ADD CONSTRAINT FK_BLOCKSTRING_SEQUENCE_STEP_ROUTE FOREIGN KEY (route_id) REFERENCES sf6.blockstring_route (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE TABLE sf6.blockstring_route_connection (id SERIAL NOT NULL, route_id INT NOT NULL, source_step_id INT DEFAULT NULL, destination_step_id INT DEFAULT NULL, gap_id INT DEFAULT NULL, ordinal INT NOT NULL, type VARCHAR(40) NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_blockstring_route_connection_route ON sf6.blockstring_route_connection (route_id, ordinal)');
        $this->addSql('CREATE INDEX idx_blockstring_route_connection_source ON sf6.blockstring_route_connection (source_step_id)');
        $this->addSql('CREATE INDEX idx_blockstring_route_connection_destination ON sf6.blockstring_route_connection (destination_step_id)');
        $this->addSql('CREATE INDEX idx_blockstring_route_connection_gap ON sf6.blockstring_route_connection (gap_id)');
        $this->addSql('ALTER TABLE sf6.blockstring_route_connection ADD CONSTRAINT FK_BLOCKSTRING_ROUTE_CONNECTION_ROUTE FOREIGN KEY (route_id) REFERENCES sf6.blockstring_route (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_route_connection ADD CONSTRAINT FK_BLOCKSTRING_ROUTE_CONNECTION_SOURCE FOREIGN KEY (source_step_id) REFERENCES sf6.blockstring_sequence_step (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_route_connection ADD CONSTRAINT FK_BLOCKSTRING_ROUTE_CONNECTION_DESTINATION FOREIGN KEY (destination_step_id) REFERENCES sf6.blockstring_sequence_step (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.blockstring_route_connection ADD CONSTRAINT FK_BLOCKSTRING_ROUTE_CONNECTION_GAP FOREIGN KEY (gap_id) REFERENCES sf6.blockstring_gap (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql("INSERT INTO sf6.blockstring_route_connection (route_id, source_step_id, destination_step_id, gap_id, ordinal, type) SELECT route.id, source_step.id, destination_step.id, gap.id, destination_step.ordinal - 1, CASE WHEN gap.id IS NOT NULL THEN 'gap' WHEN destination_step.can_confirm_on_hit THEN 'hit_confirm' ELSE 'guaranteed' END FROM sf6.blockstring_route route INNER JOIN sf6.blockstring_sequence_step destination_step ON destination_step.route_id = route.id INNER JOIN sf6.blockstring_sequence_step source_step ON source_step.route_id = route.id AND source_step.ordinal = destination_step.ordinal - 1 LEFT JOIN LATERAL (SELECT blockstring_gap.id FROM sf6.blockstring_gap WHERE blockstring_gap.step_id = destination_step.id AND blockstring_gap.timing = 'before_step' ORDER BY blockstring_gap.id ASC LIMIT 1) gap ON true WHERE route.is_main = true AND destination_step.ordinal > 1");
        $this->addSql('ALTER TABLE sf6.blockstring_route ADD CONSTRAINT FK_BLOCKSTRING_ROUTE_BRANCH_CONNECTION FOREIGN KEY (branch_anchor_connection_id) REFERENCES sf6.blockstring_route_connection (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.blockstring_route DROP CONSTRAINT FK_BLOCKSTRING_ROUTE_BRANCH_CONNECTION');
        $this->addSql('ALTER TABLE sf6.blockstring_route_connection DROP CONSTRAINT FK_BLOCKSTRING_ROUTE_CONNECTION_GAP');
        $this->addSql('ALTER TABLE sf6.blockstring_route_connection DROP CONSTRAINT FK_BLOCKSTRING_ROUTE_CONNECTION_DESTINATION');
        $this->addSql('ALTER TABLE sf6.blockstring_route_connection DROP CONSTRAINT FK_BLOCKSTRING_ROUTE_CONNECTION_SOURCE');
        $this->addSql('ALTER TABLE sf6.blockstring_route_connection DROP CONSTRAINT FK_BLOCKSTRING_ROUTE_CONNECTION_ROUTE');
        $this->addSql('DROP TABLE sf6.blockstring_route_connection');
        $this->addSql('ALTER TABLE sf6.blockstring_sequence_step DROP CONSTRAINT FK_BLOCKSTRING_SEQUENCE_STEP_ROUTE');
        $this->addSql('DROP INDEX sf6.idx_blockstring_sequence_step_route');
        $this->addSql('ALTER TABLE sf6.blockstring_sequence_step DROP route_id');
        $this->addSql('ALTER TABLE sf6.blockstring_route DROP CONSTRAINT FK_BLOCKSTRING_ROUTE_BRANCH_STEP');
        $this->addSql('ALTER TABLE sf6.blockstring_route DROP CONSTRAINT FK_BLOCKSTRING_ROUTE_SEQUENCE');
        $this->addSql('DROP TABLE sf6.blockstring_route');
    }
}
