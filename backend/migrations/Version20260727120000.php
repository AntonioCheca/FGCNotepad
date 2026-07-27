<?php declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260727120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add Raw Drive Rush move and leaf sequence for every character';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("INSERT INTO sf6.combo_sequence_type (name) SELECT 'leaf' WHERE NOT EXISTS (SELECT 1 FROM sf6.combo_sequence_type WHERE name = 'leaf')");
        $this->addSql("INSERT INTO sf6.visibility (name) SELECT 'public' WHERE NOT EXISTS (SELECT 1 FROM sf6.visibility WHERE name = 'public')");
        $this->addSql("INSERT INTO sf6.season (name, start_date, end_date) SELECT 'current', CURRENT_DATE - INTERVAL '1 day', NULL WHERE NOT EXISTS (SELECT 1 FROM sf6.season WHERE name = 'current')");

        $this->addSql(<<<'SQL'
WITH missing AS (
    SELECT c.id AS character_id
    FROM sf6.character c
    WHERE NOT EXISTS (
        SELECT 1
        FROM sf6.move m
        WHERE m.character_id = c.id
          AND m.numpad_notation = 'DR'
    )
), ids AS (
    SELECT
        character_id,
        (substr(md5('raw-drive-rush-component-' || character_id::text), 1, 8) || '-' || substr(md5('raw-drive-rush-component-' || character_id::text), 9, 4) || '-' || substr(md5('raw-drive-rush-component-' || character_id::text), 13, 4) || '-' || substr(md5('raw-drive-rush-component-' || character_id::text), 17, 4) || '-' || substr(md5('raw-drive-rush-component-' || character_id::text), 21, 12))::uuid AS move_id,
        (substr(md5('raw-drive-rush-frame-data-' || character_id::text), 1, 8) || '-' || substr(md5('raw-drive-rush-frame-data-' || character_id::text), 9, 4) || '-' || substr(md5('raw-drive-rush-frame-data-' || character_id::text), 13, 4) || '-' || substr(md5('raw-drive-rush-frame-data-' || character_id::text), 17, 4) || '-' || substr(md5('raw-drive-rush-frame-data-' || character_id::text), 21, 12))::uuid AS frame_data_id
    FROM missing
), inserted_frame_data AS (
    INSERT INTO sf6.frame_data (id, move_type, cancels_to, damage, drive_gain)
    SELECT frame_data_id, 'drive', '[]', 0, -10000
    FROM ids
    ON CONFLICT (id) DO NOTHING
), inserted_component AS (
    INSERT INTO sf6.component (id, type)
    SELECT move_id, 'move'
    FROM ids
    ON CONFLICT (id) DO NOTHING
)
INSERT INTO sf6.move (id, numpad_notation, character_id, frame_data_id)
SELECT move_id, 'DR', character_id, frame_data_id
FROM ids
SQL);

        $this->addSql(<<<'SQL'
WITH existing AS (
    SELECT
        m.id AS move_id,
        m.character_id,
        (substr(md5('raw-drive-rush-frame-data-' || m.character_id::text), 1, 8) || '-' || substr(md5('raw-drive-rush-frame-data-' || m.character_id::text), 9, 4) || '-' || substr(md5('raw-drive-rush-frame-data-' || m.character_id::text), 13, 4) || '-' || substr(md5('raw-drive-rush-frame-data-' || m.character_id::text), 17, 4) || '-' || substr(md5('raw-drive-rush-frame-data-' || m.character_id::text), 21, 12))::uuid AS frame_data_id
    FROM sf6.move m
    WHERE m.numpad_notation = 'DR'
      AND m.frame_data_id IS NULL
), inserted_frame_data AS (
    INSERT INTO sf6.frame_data (id, move_type, cancels_to, damage, drive_gain)
    SELECT frame_data_id, 'drive', '[]', 0, -10000
    FROM existing
    ON CONFLICT (id) DO NOTHING
)
UPDATE sf6.move m
SET frame_data_id = existing.frame_data_id
FROM existing
WHERE m.id = existing.move_id
  AND m.frame_data_id IS NULL
SQL);

        $this->addSql(<<<'SQL'
WITH raw_drive_rush_moves AS (
    SELECT m.id AS move_id, c.name AS character_name
    FROM sf6.move m
    INNER JOIN sf6.character c ON c.id = m.character_id
    WHERE m.numpad_notation = 'DR'
), required_data AS (
    SELECT
        (SELECT id FROM sf6.combo_sequence_type WHERE name = 'leaf' LIMIT 1) AS leaf_type_id,
        (SELECT id FROM sf6.visibility WHERE name = 'public' LIMIT 1) AS public_visibility_id
), inserted_sequences AS (
    INSERT INTO sf6.combo_sequence (move_id, type_id, name, description, visibility_id, is_essential, moderation_state)
    SELECT
        r.move_id,
        d.leaf_type_id,
        r.character_name || ' - DR',
        'Leaf move: ' || r.character_name || ' - DR',
        d.public_visibility_id,
        false,
        'approved'
    FROM raw_drive_rush_moves r
    CROSS JOIN required_data d
    WHERE NOT EXISTS (
        SELECT 1
        FROM sf6.combo_sequence cs
        WHERE cs.move_id = r.move_id
    )
    RETURNING id
)
INSERT INTO sf6.combo_metrics (sequence_id, damage)
SELECT id, 0
FROM inserted_sequences
WHERE NOT EXISTS (
    SELECT 1
    FROM sf6.combo_metrics cm
    WHERE cm.sequence_id = inserted_sequences.id
)
SQL);

        $this->addSql(<<<'SQL'
INSERT INTO sf6.combo_metrics (sequence_id, damage)
SELECT cs.id, 0
FROM sf6.combo_sequence cs
INNER JOIN sf6.move m ON m.id = cs.move_id
WHERE m.numpad_notation = 'DR'
  AND NOT EXISTS (
      SELECT 1
      FROM sf6.combo_metrics cm
      WHERE cm.sequence_id = cs.id
  )
SQL);

        $this->addSql(<<<'SQL'
INSERT INTO sf6.season_combo_sequence (combo_sequences_id, season_id)
SELECT cs.id, s.id
FROM sf6.combo_sequence cs
INNER JOIN sf6.move m ON m.id = cs.move_id
INNER JOIN sf6.season s ON s.name = 'current'
WHERE m.numpad_notation = 'DR'
  AND NOT EXISTS (
      SELECT 1
      FROM sf6.season_combo_sequence scs
      WHERE scs.combo_sequences_id = cs.id
        AND scs.season_id = s.id
  )
SQL);
    }

    public function down(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
DELETE FROM sf6.season_combo_sequence scs
USING sf6.combo_sequence cs, sf6.move m
WHERE scs.combo_sequences_id = cs.id
  AND cs.move_id = m.id
  AND m.numpad_notation = 'DR'
  AND NOT EXISTS (SELECT 1 FROM sf6.step_combo st WHERE st.child_sequence_id = cs.id OR st.parent_sequence_id = cs.id)
SQL);

        $this->addSql(<<<'SQL'
DELETE FROM sf6.combo_metrics cm
USING sf6.combo_sequence cs, sf6.move m
WHERE cm.sequence_id = cs.id
  AND cs.move_id = m.id
  AND m.numpad_notation = 'DR'
  AND NOT EXISTS (SELECT 1 FROM sf6.step_combo st WHERE st.child_sequence_id = cs.id OR st.parent_sequence_id = cs.id)
SQL);

        $this->addSql(<<<'SQL'
DELETE FROM sf6.combo_sequence cs
USING sf6.move m
WHERE cs.move_id = m.id
  AND m.numpad_notation = 'DR'
  AND NOT EXISTS (SELECT 1 FROM sf6.step_combo st WHERE st.child_sequence_id = cs.id OR st.parent_sequence_id = cs.id)
SQL);

        $this->addSql(<<<'SQL'
DELETE FROM sf6.move m
WHERE m.numpad_notation = 'DR'
  AND NOT EXISTS (SELECT 1 FROM sf6.combo_sequence cs WHERE cs.move_id = m.id)
SQL);
    }
}
