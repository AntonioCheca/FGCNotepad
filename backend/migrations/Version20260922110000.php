<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260922110000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Per-move resource effects and derived per-combo resource usage';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("CREATE TABLE sf6.move_resource_effect (id SERIAL NOT NULL, move_id UUID NOT NULL, character_object_id INT NOT NULL, edited_by_id UUID DEFAULT NULL, mode VARCHAR(16) DEFAULT 'relative' NOT NULL, amount INT NOT NULL, source VARCHAR(16) DEFAULT 'manual' NOT NULL, observation_count INT DEFAULT 0 NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))");
        $this->addSql('CREATE INDEX IDX_BF206AFE6DC541A8 ON sf6.move_resource_effect (move_id)');
        $this->addSql('CREATE INDEX IDX_BF206AFEA47DF410 ON sf6.move_resource_effect (character_object_id)');
        $this->addSql('CREATE INDEX IDX_BF206AFEDD7B2EBC ON sf6.move_resource_effect (edited_by_id)');
        $this->addSql('CREATE UNIQUE INDEX uniq_move_resource_effect ON sf6.move_resource_effect (move_id, character_object_id)');
        $this->addSql("COMMENT ON COLUMN sf6.move_resource_effect.move_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN sf6.move_resource_effect.edited_by_id IS '(DC2Type:uuid)'");
        $this->addSql("COMMENT ON COLUMN sf6.move_resource_effect.updated_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql('ALTER TABLE sf6.move_resource_effect ADD CONSTRAINT fk_move_resource_effect_move FOREIGN KEY (move_id) REFERENCES sf6.move (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE sf6.move_resource_effect ADD CONSTRAINT fk_move_resource_effect_object FOREIGN KEY (character_object_id) REFERENCES sf6.character_object (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE sf6.move_resource_effect ADD CONSTRAINT fk_move_resource_effect_editor FOREIGN KEY (edited_by_id) REFERENCES forum."user" (id) ON DELETE SET NULL');

        $this->addSql('CREATE TABLE sf6.combo_resource_usage (id SERIAL NOT NULL, combo_id INT NOT NULL, character_object_id INT NOT NULL, start_value INT NOT NULL, spent INT NOT NULL, gained INT NOT NULL, end_value INT NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_FD933582EB6587E3 ON sf6.combo_resource_usage (combo_id)');
        $this->addSql('CREATE INDEX idx_combo_resource_usage_object ON sf6.combo_resource_usage (character_object_id)');
        $this->addSql('CREATE UNIQUE INDEX uniq_combo_resource_usage ON sf6.combo_resource_usage (combo_id, character_object_id)');
        $this->addSql('ALTER TABLE sf6.combo_resource_usage ADD CONSTRAINT fk_combo_resource_usage_combo FOREIGN KEY (combo_id) REFERENCES sf6.combo_sequence (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE sf6.combo_resource_usage ADD CONSTRAINT fk_combo_resource_usage_object FOREIGN KEY (character_object_id) REFERENCES sf6.character_object (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE sf6.combo_resource_usage');
        $this->addSql('DROP TABLE sf6.move_resource_effect');
    }
}
