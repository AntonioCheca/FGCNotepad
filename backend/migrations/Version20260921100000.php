<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260921100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add Walk Forward, Walk Back and Super Cancel connection types; replay home ids and combo observation start fields';
    }

    public function up(Schema $schema): void
    {
        foreach (['Super Cancel', 'Walk Forward', 'Walk Back'] as $name) {
            $this->addSql(sprintf(
                "INSERT INTO sf6.connection_type (name) SELECT '%s' WHERE NOT EXISTS (SELECT 1 FROM sf6.connection_type WHERE name = '%s')",
                $name,
                $name
            ));
        }

        $this->addSql('ALTER TABLE sf6.replay_player ADD home_id INT DEFAULT NULL, ADD home_category_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.combo_observation ADD start_round_timer INT DEFAULT NULL, ADD start_replay_frame INT DEFAULT NULL, ADD start_source_index INT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.combo_observation DROP start_round_timer, DROP start_replay_frame, DROP start_source_index');
        $this->addSql('ALTER TABLE sf6.replay_player DROP home_id, DROP home_category_id');
        $this->addSql("DELETE FROM sf6.connection_type WHERE name IN ('Super Cancel', 'Walk Forward', 'Walk Back') AND NOT EXISTS (SELECT 1 FROM sf6.step_combo s WHERE s.connection_type_id = connection_type.id)");
    }
}
