<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260422154500 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add combo difficulty level, execution preference, and per-character known combo profile';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.combo_metrics ADD COLUMN IF NOT EXISTS difficulty_level INT DEFAULT NULL');

        $this->addSql(<<<'SQL'
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'sf6' AND table_name = 'user_combo' AND column_name = 'user_name_id'
    ) THEN
        EXECUTE 'ALTER TABLE sf6.user_combo RENAME COLUMN user_name_id TO user_id';
    END IF;
END
$$;
SQL);

        $this->addSql('ALTER TABLE sf6.user_combo ADD COLUMN IF NOT EXISTS character_id UUID DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.user_combo ADD COLUMN IF NOT EXISTS known BOOLEAN NOT NULL DEFAULT TRUE');
        $this->addSql('COMMENT ON COLUMN sf6.user_combo.character_id IS \'(DC2Type:uuid)\'');

        $this->addSql('DROP INDEX IF EXISTS sf6.IDX_76297E8B291A82DC');
        $this->addSql('DROP INDEX IF EXISTS sf6.IDX_76297E8BEB6587E3');
        $this->addSql('ALTER TABLE sf6.user_combo DROP CONSTRAINT IF EXISTS FK_76297E8B291A82DC');
        $this->addSql('ALTER TABLE sf6.user_combo DROP CONSTRAINT IF EXISTS FK_76297E8BEB6587E3');

        $this->addSql(<<<'SQL'
UPDATE sf6.user_combo user_combo
SET character_id = COALESCE(direct_move.character_id, starter_character.character_id)
FROM sf6.combo_sequence combo
LEFT JOIN sf6.move direct_move
    ON combo.move_id = direct_move.id
LEFT JOIN LATERAL (
    SELECT starter_move.character_id
    FROM sf6.step_combo starter_step
    INNER JOIN sf6.combo_sequence starter_sequence ON starter_step.child_sequence_id = starter_sequence.id
    INNER JOIN sf6.move starter_move ON starter_sequence.move_id = starter_move.id
    WHERE starter_step.parent_sequence_id = combo.id
    ORDER BY starter_step.ordinal_in_combo ASC
    LIMIT 1
) AS starter_character ON TRUE
WHERE user_combo.combo_id = combo.id
  AND user_combo.character_id IS NULL
SQL);

        $this->addSql('DELETE FROM sf6.user_combo WHERE character_id IS NULL');

        $this->addSql('ALTER TABLE sf6.user_combo ALTER COLUMN character_id SET NOT NULL');
        $this->addSql('ALTER TABLE sf6.user_combo ALTER COLUMN user_id SET NOT NULL');

        $this->addSql('ALTER TABLE sf6.user_combo ADD CONSTRAINT FK_USER_COMBO_USER FOREIGN KEY (user_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.user_combo ADD CONSTRAINT FK_USER_COMBO_COMBO FOREIGN KEY (combo_id) REFERENCES sf6.combo_sequence (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.user_combo ADD CONSTRAINT FK_USER_COMBO_CHARACTER FOREIGN KEY (character_id) REFERENCES sf6."character" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('CREATE INDEX IF NOT EXISTS IDX_USER_COMBO_USER ON sf6.user_combo (user_id)');
        $this->addSql('CREATE INDEX IF NOT EXISTS IDX_USER_COMBO_CHARACTER ON sf6.user_combo (character_id)');
        $this->addSql('CREATE INDEX IF NOT EXISTS IDX_USER_COMBO_COMBO ON sf6.user_combo (combo_id)');
        $this->addSql('CREATE UNIQUE INDEX IF NOT EXISTS UNIQ_USER_COMBO_CHARACTER ON sf6.user_combo (user_id, character_id, combo_id)');

        $this->addSql('CREATE TABLE IF NOT EXISTS forum.user_scenario_preference (id SERIAL NOT NULL, user_id UUID NOT NULL, default_mode VARCHAR(32) NOT NULL, difficulty_cap INT DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX IF NOT EXISTS UNIQ_USER_SCENARIO_PREFERENCE_USER ON forum.user_scenario_preference (user_id)');
        $this->addSql('COMMENT ON COLUMN forum.user_scenario_preference.user_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE forum.user_scenario_preference ADD CONSTRAINT FK_USER_SCENARIO_PREFERENCE_USER FOREIGN KEY (user_id) REFERENCES forum."user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE forum.user_scenario_preference DROP CONSTRAINT IF EXISTS FK_USER_SCENARIO_PREFERENCE_USER');
        $this->addSql('DROP TABLE IF EXISTS forum.user_scenario_preference');

        $this->addSql('DROP INDEX IF EXISTS sf6.UNIQ_USER_COMBO_CHARACTER');
        $this->addSql('DROP INDEX IF EXISTS sf6.IDX_USER_COMBO_USER');
        $this->addSql('DROP INDEX IF EXISTS sf6.IDX_USER_COMBO_CHARACTER');
        $this->addSql('DROP INDEX IF EXISTS sf6.IDX_USER_COMBO_COMBO');

        $this->addSql('ALTER TABLE sf6.user_combo DROP CONSTRAINT IF EXISTS FK_USER_COMBO_USER');
        $this->addSql('ALTER TABLE sf6.user_combo DROP CONSTRAINT IF EXISTS FK_USER_COMBO_COMBO');
        $this->addSql('ALTER TABLE sf6.user_combo DROP CONSTRAINT IF EXISTS FK_USER_COMBO_CHARACTER');

        $this->addSql('ALTER TABLE sf6.user_combo DROP COLUMN IF EXISTS character_id');
        $this->addSql('ALTER TABLE sf6.user_combo DROP COLUMN IF EXISTS known');

        $this->addSql(<<<'SQL'
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'sf6' AND table_name = 'user_combo' AND column_name = 'user_id'
    ) THEN
        EXECUTE 'ALTER TABLE sf6.user_combo RENAME COLUMN user_id TO user_name_id';
    END IF;
END
$$;
SQL);

        $this->addSql('CREATE INDEX IF NOT EXISTS IDX_76297E8B291A82DC ON sf6.user_combo (user_name_id)');
        $this->addSql('CREATE INDEX IF NOT EXISTS IDX_76297E8BEB6587E3 ON sf6.user_combo (combo_id)');
        $this->addSql('COMMENT ON COLUMN sf6.user_combo.user_name_id IS \'(DC2Type:uuid)\'');
        $this->addSql('ALTER TABLE sf6.user_combo ADD CONSTRAINT FK_76297E8B291A82DC FOREIGN KEY (user_name_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.user_combo ADD CONSTRAINT FK_76297E8BEB6587E3 FOREIGN KEY (combo_id) REFERENCES sf6.combo_sequence (id) NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql('ALTER TABLE sf6.combo_metrics DROP COLUMN IF EXISTS difficulty_level');
    }
}
