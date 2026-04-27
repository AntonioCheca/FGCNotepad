<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20250729122523 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Adding relation from combos to season, user and visibility';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE sf6.season_combo_sequence (combo_sequences_id INT NOT NULL, season_id INT NOT NULL, PRIMARY KEY(combo_sequences_id, season_id))');
        $this->addSql('CREATE INDEX IDX_29C087495C63522F ON sf6.season_combo_sequence (combo_sequences_id)');
        $this->addSql('CREATE INDEX IDX_29C087494EC001D1 ON sf6.season_combo_sequence (season_id)');
        $this->addSql('CREATE TABLE sf6.season (id SERIAL NOT NULL, name TEXT NOT NULL, start_date DATE DEFAULT NULL, end_date DATE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE TABLE sf6.user_combo (id SERIAL NOT NULL, user_name_id UUID NOT NULL, combo_id INT NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_76297E8B291A82DC ON sf6.user_combo (user_name_id)');
        $this->addSql('CREATE INDEX IDX_76297E8BEB6587E3 ON sf6.user_combo (combo_id)');
        $this->addSql('COMMENT ON COLUMN sf6.user_combo.user_name_id IS \'(DC2Type:uuid)\'');
        $this->addSql('CREATE TABLE sf6.visibility (id SERIAL NOT NULL, name TEXT NOT NULL, PRIMARY KEY(id))');
        $this->addSql('ALTER TABLE sf6.season_combo_sequence ADD CONSTRAINT FK_29C087495C63522F FOREIGN KEY (combo_sequences_id) REFERENCES sf6.combo_sequence (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.season_combo_sequence ADD CONSTRAINT FK_29C087494EC001D1 FOREIGN KEY (season_id) REFERENCES sf6.season (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.user_combo ADD CONSTRAINT FK_76297E8B291A82DC FOREIGN KEY (user_name_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.user_combo ADD CONSTRAINT FK_76297E8BEB6587E3 FOREIGN KEY (combo_id) REFERENCES sf6.combo_sequence (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sf6.combo_sequence ADD visibility_id INT NOT NULL');
        $this->addSql('ALTER TABLE sf6.combo_sequence ADD CONSTRAINT FK_8AC25213B7157780 FOREIGN KEY (visibility_id) REFERENCES sf6.visibility (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE INDEX IDX_8AC25213B7157780 ON sf6.combo_sequence (visibility_id)');
        $this->addSql('ALTER TABLE sf6.move DROP CONSTRAINT FK_CD33AD741136BE75');
        $this->addSql('ALTER TABLE sf6.move ADD CONSTRAINT FK_CD33AD741136BE75 FOREIGN KEY (character_id) REFERENCES sf6.character (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE forum.post DROP CONSTRAINT FK_5DD90525F675F31B');
        $this->addSql('ALTER TABLE forum.post ADD CONSTRAINT FK_5DD90525F675F31B FOREIGN KEY (author_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.combo_sequence DROP CONSTRAINT FK_8AC25213B7157780');
        $this->addSql('ALTER TABLE sf6.season_combo_sequence DROP CONSTRAINT FK_29C087495C63522F');
        $this->addSql('ALTER TABLE sf6.season_combo_sequence DROP CONSTRAINT FK_29C087494EC001D1');
        $this->addSql('ALTER TABLE sf6.user_combo DROP CONSTRAINT FK_76297E8B291A82DC');
        $this->addSql('ALTER TABLE sf6.user_combo DROP CONSTRAINT FK_76297E8BEB6587E3');
        $this->addSql('DROP TABLE sf6.season_combo_sequence');
        $this->addSql('DROP TABLE sf6.season');
        $this->addSql('DROP TABLE sf6.user_combo');
        $this->addSql('DROP TABLE sf6.visibility');
        $this->addSql('ALTER TABLE sf6.move DROP CONSTRAINT fk_cd33ad741136be75');
        $this->addSql('ALTER TABLE sf6.move ADD CONSTRAINT fk_cd33ad741136be75 FOREIGN KEY (character_id) REFERENCES sf6."character" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('DROP INDEX IDX_8AC25213B7157780');
        $this->addSql('ALTER TABLE sf6.combo_sequence DROP visibility_id');
        $this->addSql('ALTER TABLE forum.post DROP CONSTRAINT fk_5dd90525f675f31b');
        $this->addSql('ALTER TABLE forum.post ADD CONSTRAINT fk_5dd90525f675f31b FOREIGN KEY (author_id) REFERENCES forum."user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }
}
