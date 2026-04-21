<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260421120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add delay frame window fields to combo steps';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.step_combo ADD delay_min_frames INT DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.step_combo ADD delay_max_frames INT DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.step_combo ADD CONSTRAINT CHK_STEP_COMBO_DELAY_MIN_NON_NEGATIVE CHECK (delay_min_frames IS NULL OR delay_min_frames >= 0)');
        $this->addSql('ALTER TABLE sf6.step_combo ADD CONSTRAINT CHK_STEP_COMBO_DELAY_MAX_NON_NEGATIVE CHECK (delay_max_frames IS NULL OR delay_max_frames >= 0)');
        $this->addSql('ALTER TABLE sf6.step_combo ADD CONSTRAINT CHK_STEP_COMBO_DELAY_WINDOW_VALID CHECK (delay_min_frames IS NULL OR delay_max_frames IS NULL OR delay_min_frames <= delay_max_frames)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.step_combo DROP CONSTRAINT CHK_STEP_COMBO_DELAY_WINDOW_VALID');
        $this->addSql('ALTER TABLE sf6.step_combo DROP CONSTRAINT CHK_STEP_COMBO_DELAY_MAX_NON_NEGATIVE');
        $this->addSql('ALTER TABLE sf6.step_combo DROP CONSTRAINT CHK_STEP_COMBO_DELAY_MIN_NON_NEGATIVE');
        $this->addSql('ALTER TABLE sf6.step_combo DROP delay_min_frames');
        $this->addSql('ALTER TABLE sf6.step_combo DROP delay_max_frames');
    }
}
