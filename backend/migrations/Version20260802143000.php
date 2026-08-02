<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260802143000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add single spacing filter to Blockstring adaptation combo searches';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.blockstring_adaptation_combo_search ADD spacing_id INT DEFAULT NULL');
        $this->addSql('CREATE INDEX idx_blockstring_adaptation_combo_search_spacing ON sf6.blockstring_adaptation_combo_search (spacing_id)');
        $this->addSql('ALTER TABLE sf6.blockstring_adaptation_combo_search ADD CONSTRAINT FK_BLOCKSTRING_ADAPTATION_COMBO_SEARCH_SPACING FOREIGN KEY (spacing_id) REFERENCES sf6.combo_spacing (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.blockstring_adaptation_combo_search DROP CONSTRAINT FK_BLOCKSTRING_ADAPTATION_COMBO_SEARCH_SPACING');
        $this->addSql('DROP INDEX sf6.idx_blockstring_adaptation_combo_search_spacing');
        $this->addSql('ALTER TABLE sf6.blockstring_adaptation_combo_search DROP spacing_id');
    }
}
