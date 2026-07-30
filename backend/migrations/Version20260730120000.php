<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260730120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add normalized oki profiles, setup trees, option interactions, and character reversals';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE sf6.oki_profile (id SERIAL NOT NULL, move_id UUID NOT NULL, frame_advantage SMALLINT DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX uniq_oki_profile_move ON sf6.oki_profile (move_id)');
        $this->addSql('ALTER TABLE sf6.oki_profile ADD CONSTRAINT FK_OKI_PROFILE_MOVE FOREIGN KEY (move_id) REFERENCES sf6.move (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE TABLE sf6.oki_setup (id SERIAL NOT NULL, oki_profile_id INT NOT NULL, uses_drive_rush BOOLEAN DEFAULT false NOT NULL, auto_timed BOOLEAN DEFAULT false NOT NULL, corner_only BOOLEAN DEFAULT false NOT NULL, works_no_backroll BOOLEAN DEFAULT true NOT NULL, works_backroll BOOLEAN DEFAULT true NOT NULL, fake_no_backroll BOOLEAN DEFAULT false NOT NULL, fake_backroll BOOLEAN DEFAULT false NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_oki_setup_profile ON sf6.oki_setup (oki_profile_id)');
        $this->addSql('ALTER TABLE sf6.oki_setup ADD CONSTRAINT FK_OKI_SETUP_PROFILE FOREIGN KEY (oki_profile_id) REFERENCES sf6.oki_profile (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE TABLE sf6.oki_node (id SERIAL NOT NULL, oki_setup_id INT NOT NULL, move_id UUID NOT NULL, sort_order SMALLINT DEFAULT 0 NOT NULL, is_default_route BOOLEAN DEFAULT false NOT NULL, route_explanation TEXT DEFAULT NULL, option_type VARCHAR(40) DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_oki_node_setup ON sf6.oki_node (oki_setup_id)');
        $this->addSql('CREATE INDEX idx_oki_node_move ON sf6.oki_node (move_id)');
        $this->addSql('CREATE INDEX idx_oki_node_option_type ON sf6.oki_node (option_type)');
        $this->addSql('ALTER TABLE sf6.oki_node ADD CONSTRAINT FK_OKI_NODE_SETUP FOREIGN KEY (oki_setup_id) REFERENCES sf6.oki_setup (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.oki_node ADD CONSTRAINT FK_OKI_NODE_MOVE FOREIGN KEY (move_id) REFERENCES sf6.move (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql("ALTER TABLE sf6.oki_node ADD CONSTRAINT chk_oki_node_option_type CHECK (option_type IS NULL OR option_type IN ('STRIKE', 'MEATY_STRIKE', 'MEATY_THROW', 'SHIMMY', 'DELAY_STRIKE', 'DELAY_THROW'))");

        $this->addSql('CREATE TABLE sf6.oki_node_link (id SERIAL NOT NULL, from_node_id INT NOT NULL, to_node_id INT NOT NULL, step_type VARCHAR(32) NOT NULL, min_frames SMALLINT DEFAULT NULL, max_frames SMALLINT DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_oki_node_link_from ON sf6.oki_node_link (from_node_id)');
        $this->addSql('CREATE INDEX idx_oki_node_link_to ON sf6.oki_node_link (to_node_id)');
        $this->addSql('ALTER TABLE sf6.oki_node_link ADD CONSTRAINT FK_OKI_NODE_LINK_FROM FOREIGN KEY (from_node_id) REFERENCES sf6.oki_node (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.oki_node_link ADD CONSTRAINT FK_OKI_NODE_LINK_TO FOREIGN KEY (to_node_id) REFERENCES sf6.oki_node (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql("ALTER TABLE sf6.oki_node_link ADD CONSTRAINT chk_oki_node_link_step_type CHECK (step_type IN ('IMMEDIATE', 'WALK_FORWARD', 'WALK_BACKWARD', 'WAIT'))");
        $this->addSql("ALTER TABLE sf6.oki_node_link ADD CONSTRAINT chk_oki_node_link_frame_window CHECK ((step_type = 'IMMEDIATE' AND min_frames IS NULL AND max_frames IS NULL) OR (step_type <> 'IMMEDIATE' AND min_frames IS NOT NULL AND max_frames IS NOT NULL AND min_frames >= 0 AND max_frames >= min_frames))");

        $this->addSql('CREATE TABLE sf6.oki_node_property (id SERIAL NOT NULL, oki_node_id INT NOT NULL, property VARCHAR(48) NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_oki_node_property_node ON sf6.oki_node_property (oki_node_id)');
        $this->addSql('CREATE INDEX idx_oki_node_property_property ON sf6.oki_node_property (property)');
        $this->addSql('ALTER TABLE sf6.oki_node_property ADD CONSTRAINT FK_OKI_NODE_PROPERTY_NODE FOREIGN KEY (oki_node_id) REFERENCES sf6.oki_node (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql("ALTER TABLE sf6.oki_node_property ADD CONSTRAINT chk_oki_node_property_property CHECK (property IN ('OVERHEAD', 'LOW', 'LEFT_RIGHT', 'SAFE_JUMP', 'FAKE_SAFE_JUMP', 'REVERSAL_BAIT', 'ANTI_DRIVE_REVERSAL', 'CHARACTER_SPECIFIC'))");

        $this->addSql('CREATE TABLE sf6.oki_option_interaction (id SERIAL NOT NULL, oki_node_id INT NOT NULL, defensive_move_id UUID NOT NULL, result VARCHAR(24) NOT NULL, character_id UUID DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_oki_option_interaction_node ON sf6.oki_option_interaction (oki_node_id)');
        $this->addSql('CREATE INDEX idx_oki_option_interaction_defensive_move ON sf6.oki_option_interaction (defensive_move_id)');
        $this->addSql('CREATE INDEX idx_oki_option_interaction_character ON sf6.oki_option_interaction (character_id)');
        $this->addSql('CREATE INDEX idx_oki_option_interaction_result ON sf6.oki_option_interaction (result)');
        $this->addSql('ALTER TABLE sf6.oki_option_interaction ADD CONSTRAINT FK_OKI_OPTION_INTERACTION_NODE FOREIGN KEY (oki_node_id) REFERENCES sf6.oki_node (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.oki_option_interaction ADD CONSTRAINT FK_OKI_OPTION_INTERACTION_DEFENSIVE_MOVE FOREIGN KEY (defensive_move_id) REFERENCES sf6.move (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.oki_option_interaction ADD CONSTRAINT FK_OKI_OPTION_INTERACTION_CHARACTER FOREIGN KEY (character_id) REFERENCES sf6.character (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql("ALTER TABLE sf6.oki_option_interaction ADD CONSTRAINT chk_oki_option_interaction_result CHECK (result IN ('WINS', 'LOSES', 'NEUTRAL', 'TRADES'))");

        $this->addSql('CREATE TABLE sf6.character_reversal (id SERIAL NOT NULL, character_id UUID NOT NULL, move_id UUID NOT NULL, startup SMALLINT NOT NULL, reversal_type VARCHAR(32) NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_character_reversal_character ON sf6.character_reversal (character_id)');
        $this->addSql('CREATE INDEX idx_character_reversal_move ON sf6.character_reversal (move_id)');
        $this->addSql('CREATE UNIQUE INDEX uniq_character_reversal_move ON sf6.character_reversal (character_id, move_id)');
        $this->addSql('ALTER TABLE sf6.character_reversal ADD CONSTRAINT FK_CHARACTER_REVERSAL_CHARACTER FOREIGN KEY (character_id) REFERENCES sf6.character (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.character_reversal ADD CONSTRAINT FK_CHARACTER_REVERSAL_MOVE FOREIGN KEY (move_id) REFERENCES sf6.move (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql("ALTER TABLE sf6.character_reversal ADD CONSTRAINT chk_character_reversal_type CHECK (reversal_type IN ('OD_REVERSAL', 'SUPER', 'COMMAND_REVERSAL', 'OTHER'))");

        $this->addSql('CREATE TABLE sf6.reversal_property (id SERIAL NOT NULL, character_reversal_id INT NOT NULL, property VARCHAR(48) NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_reversal_property_reversal ON sf6.reversal_property (character_reversal_id)');
        $this->addSql('CREATE INDEX idx_reversal_property_property ON sf6.reversal_property (property)');
        $this->addSql('ALTER TABLE sf6.reversal_property ADD CONSTRAINT FK_REVERSAL_PROPERTY_REVERSAL FOREIGN KEY (character_reversal_id) REFERENCES sf6.character_reversal (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql("ALTER TABLE sf6.reversal_property ADD CONSTRAINT chk_reversal_property_property CHECK (property IN ('STRIKE_INVULNERABLE', 'THROW_INVULNERABLE', 'HITS_CROUCHING', 'WHIFFS_AGAINST_CROUCHING', 'AIR_INVULNERABLE'))");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE sf6.reversal_property');
        $this->addSql('DROP TABLE sf6.character_reversal');
        $this->addSql('DROP TABLE sf6.oki_option_interaction');
        $this->addSql('DROP TABLE sf6.oki_node_property');
        $this->addSql('DROP TABLE sf6.oki_node_link');
        $this->addSql('DROP TABLE sf6.oki_node');
        $this->addSql('DROP TABLE sf6.oki_setup');
        $this->addSql('DROP TABLE sf6.oki_profile');
    }
}
