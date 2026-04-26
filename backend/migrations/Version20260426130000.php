<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260426130000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add moderation workflow fields to post, combo, and scenario content';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE forum.post ADD moderation_state VARCHAR(32) DEFAULT 'approved' NOT NULL");
        $this->addSql('ALTER TABLE forum.post ADD submitted_for_review_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE forum.post ADD moderation_decided_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE forum.post ADD moderation_decided_by_id UUID DEFAULT NULL');
        $this->addSql('ALTER TABLE forum.post ADD moderation_reason TEXT DEFAULT NULL');
        $this->addSql('CREATE INDEX IDX_POST_MODERATION_STATE ON forum.post (moderation_state)');
        $this->addSql('CREATE INDEX IDX_POST_MODERATION_DECIDED_BY ON forum.post (moderation_decided_by_id)');
        $this->addSql('ALTER TABLE forum.post ADD CONSTRAINT FK_POST_MODERATION_DECIDED_BY FOREIGN KEY (moderation_decided_by_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql("COMMENT ON COLUMN forum.post.moderation_decided_by_id IS '(DC2Type:uuid)'");

        $this->addSql("ALTER TABLE sf6.combo_sequence ADD moderation_state VARCHAR(32) DEFAULT 'approved' NOT NULL");
        $this->addSql('ALTER TABLE sf6.combo_sequence ADD submitted_for_review_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.combo_sequence ADD moderation_decided_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.combo_sequence ADD moderation_decided_by_id UUID DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.combo_sequence ADD moderation_reason TEXT DEFAULT NULL');
        $this->addSql('CREATE INDEX IDX_COMBO_MODERATION_STATE ON sf6.combo_sequence (moderation_state)');
        $this->addSql('CREATE INDEX IDX_COMBO_MODERATION_DECIDED_BY ON sf6.combo_sequence (moderation_decided_by_id)');
        $this->addSql('ALTER TABLE sf6.combo_sequence ADD CONSTRAINT FK_COMBO_MODERATION_DECIDED_BY FOREIGN KEY (moderation_decided_by_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql("COMMENT ON COLUMN sf6.combo_sequence.moderation_decided_by_id IS '(DC2Type:uuid)'");

        $this->addSql("ALTER TABLE sf6.scenario ADD moderation_state VARCHAR(32) DEFAULT 'approved' NOT NULL");
        $this->addSql('ALTER TABLE sf6.scenario ADD submitted_for_review_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.scenario ADD moderation_decided_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.scenario ADD moderation_decided_by_id UUID DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.scenario ADD moderation_reason TEXT DEFAULT NULL');
        $this->addSql('CREATE INDEX IDX_SCENARIO_MODERATION_STATE ON sf6.scenario (moderation_state)');
        $this->addSql('CREATE INDEX IDX_SCENARIO_MODERATION_DECIDED_BY ON sf6.scenario (moderation_decided_by_id)');
        $this->addSql('ALTER TABLE sf6.scenario ADD CONSTRAINT FK_SCENARIO_MODERATION_DECIDED_BY FOREIGN KEY (moderation_decided_by_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql("COMMENT ON COLUMN sf6.scenario.moderation_decided_by_id IS '(DC2Type:uuid)'");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE forum.post DROP CONSTRAINT FK_POST_MODERATION_DECIDED_BY');
        $this->addSql('DROP INDEX IDX_POST_MODERATION_STATE');
        $this->addSql('DROP INDEX IDX_POST_MODERATION_DECIDED_BY');
        $this->addSql('ALTER TABLE forum.post DROP moderation_state');
        $this->addSql('ALTER TABLE forum.post DROP submitted_for_review_at');
        $this->addSql('ALTER TABLE forum.post DROP moderation_decided_at');
        $this->addSql('ALTER TABLE forum.post DROP moderation_decided_by_id');
        $this->addSql('ALTER TABLE forum.post DROP moderation_reason');

        $this->addSql('ALTER TABLE sf6.combo_sequence DROP CONSTRAINT FK_COMBO_MODERATION_DECIDED_BY');
        $this->addSql('DROP INDEX IDX_COMBO_MODERATION_STATE');
        $this->addSql('DROP INDEX IDX_COMBO_MODERATION_DECIDED_BY');
        $this->addSql('ALTER TABLE sf6.combo_sequence DROP moderation_state');
        $this->addSql('ALTER TABLE sf6.combo_sequence DROP submitted_for_review_at');
        $this->addSql('ALTER TABLE sf6.combo_sequence DROP moderation_decided_at');
        $this->addSql('ALTER TABLE sf6.combo_sequence DROP moderation_decided_by_id');
        $this->addSql('ALTER TABLE sf6.combo_sequence DROP moderation_reason');

        $this->addSql('ALTER TABLE sf6.scenario DROP CONSTRAINT FK_SCENARIO_MODERATION_DECIDED_BY');
        $this->addSql('DROP INDEX IDX_SCENARIO_MODERATION_STATE');
        $this->addSql('DROP INDEX IDX_SCENARIO_MODERATION_DECIDED_BY');
        $this->addSql('ALTER TABLE sf6.scenario DROP moderation_state');
        $this->addSql('ALTER TABLE sf6.scenario DROP submitted_for_review_at');
        $this->addSql('ALTER TABLE sf6.scenario DROP moderation_decided_at');
        $this->addSql('ALTER TABLE sf6.scenario DROP moderation_decided_by_id');
        $this->addSql('ALTER TABLE sf6.scenario DROP moderation_reason');
    }
}
