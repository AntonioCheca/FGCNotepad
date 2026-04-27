<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20250930203343 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Adding Scenarios and related tables';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE sf6.scenario (id SERIAL NOT NULL, type_id INT NOT NULL, name TEXT NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_E4D975EFC54C8C93 ON sf6.scenario (type_id)');
        $this->addSql('CREATE TABLE sf6.scenario_layer (id SERIAL NOT NULL, scenario_id INT NOT NULL, index INT NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_4D748501E04E49DF ON sf6.scenario_layer (scenario_id)');
        $this->addSql('CREATE TABLE sf6.scenario_layer_first_options (layer_id INT NOT NULL, option_id INT NOT NULL, PRIMARY KEY(layer_id, option_id))');
        $this->addSql('CREATE INDEX IDX_76334F44EA6EFDCD ON sf6.scenario_layer_first_options (layer_id)');
        $this->addSql('CREATE INDEX IDX_76334F44A7C41D6F ON sf6.scenario_layer_first_options (option_id)');
        $this->addSql('CREATE TABLE sf6.scenario_layer_second_options (layer_id INT NOT NULL, option_id INT NOT NULL, PRIMARY KEY(layer_id, option_id))');
        $this->addSql('CREATE INDEX IDX_71A4DD0EEA6EFDCD ON sf6.scenario_layer_second_options (layer_id)');
        $this->addSql('CREATE INDEX IDX_71A4DD0EA7C41D6F ON sf6.scenario_layer_second_options (option_id)');
        $this->addSql('CREATE TABLE sf6.scenario_option (id SERIAL NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE TABLE sf6.scenario_option_part (id SERIAL NOT NULL, move_id UUID NOT NULL, frames_of_duration INT NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_8E167E976DC541A8 ON sf6.scenario_option_part (move_id)');
        $this->addSql('COMMENT ON COLUMN sf6.scenario_option_part.move_id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE sf6.scenario_option_relationships (id SERIAL NOT NULL, option_id INT NOT NULL, move_id INT NOT NULL, index INT NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_43F0D8B1A7C41D6F ON sf6.scenario_option_relationships (option_id)');
        $this->addSql('CREATE INDEX IDX_43F0D8B16DC541A8 ON sf6.scenario_option_relationships (move_id)');
        $this->addSql('CREATE TABLE sf6.scenario_type (id SERIAL NOT NULL, name TEXT NOT NULL, PRIMARY KEY(id))');
        $this->addSql('ALTER TABLE sf6.scenario ADD CONSTRAINT FK_E4D975EFC54C8C93 FOREIGN KEY (type_id) REFERENCES sf6.scenario_type (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.scenario_layer ADD CONSTRAINT FK_4D748501E04E49DF FOREIGN KEY (scenario_id) REFERENCES sf6.scenario (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.scenario_layer_first_options ADD CONSTRAINT FK_76334F44EA6EFDCD FOREIGN KEY (layer_id) REFERENCES sf6.scenario_layer (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.scenario_layer_first_options ADD CONSTRAINT FK_76334F44A7C41D6F FOREIGN KEY (option_id) REFERENCES sf6.scenario_option (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.scenario_layer_second_options ADD CONSTRAINT FK_71A4DD0EEA6EFDCD FOREIGN KEY (layer_id) REFERENCES sf6.scenario_layer (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.scenario_layer_second_options ADD CONSTRAINT FK_71A4DD0EA7C41D6F FOREIGN KEY (option_id) REFERENCES sf6.scenario_option (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.scenario_option_part ADD CONSTRAINT FK_8E167E976DC541A8 FOREIGN KEY (move_id) REFERENCES sf6.move (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.scenario_option_relationships ADD CONSTRAINT FK_43F0D8B1A7C41D6F FOREIGN KEY (option_id) REFERENCES sf6.scenario_option (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.scenario_option_relationships ADD CONSTRAINT FK_43F0D8B16DC541A8 FOREIGN KEY (move_id) REFERENCES sf6.scenario_option_part (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE sf6.scenario DROP CONSTRAINT FK_E4D975EFC54C8C93');
        $this->addSql('ALTER TABLE sf6.scenario_layer DROP CONSTRAINT FK_4D748501E04E49DF');
        $this->addSql('ALTER TABLE sf6.scenario_layer_first_options DROP CONSTRAINT FK_76334F44EA6EFDCD');
        $this->addSql('ALTER TABLE sf6.scenario_layer_first_options DROP CONSTRAINT FK_76334F44A7C41D6F');
        $this->addSql('ALTER TABLE sf6.scenario_layer_second_options DROP CONSTRAINT FK_71A4DD0EEA6EFDCD');
        $this->addSql('ALTER TABLE sf6.scenario_layer_second_options DROP CONSTRAINT FK_71A4DD0EA7C41D6F');
        $this->addSql('ALTER TABLE sf6.scenario_option_part DROP CONSTRAINT FK_8E167E976DC541A8');
        $this->addSql('ALTER TABLE sf6.scenario_option_relationships DROP CONSTRAINT FK_43F0D8B1A7C41D6F');
        $this->addSql('ALTER TABLE sf6.scenario_option_relationships DROP CONSTRAINT FK_43F0D8B16DC541A8');
        $this->addSql('DROP TABLE sf6.scenario');
        $this->addSql('DROP TABLE sf6.scenario_layer');
        $this->addSql('DROP TABLE sf6.scenario_layer_first_options');
        $this->addSql('DROP TABLE sf6.scenario_layer_second_options');
        $this->addSql('DROP TABLE sf6.scenario_option');
        $this->addSql('DROP TABLE sf6.scenario_option_part');
        $this->addSql('DROP TABLE sf6.scenario_option_relationships');
        $this->addSql('DROP TABLE sf6.scenario_type');
    }
}
