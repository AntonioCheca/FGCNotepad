<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260929120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add optional state conditions (install, defender status) to notation translation rules';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.notation_translation ADD condition_kind VARCHAR(16) DEFAULT NULL');
        $this->addSql('ALTER TABLE sf6.notation_translation ADD condition_value VARCHAR(64) DEFAULT NULL');
        $this->addSql("ALTER TABLE sf6.notation_translation ADD CONSTRAINT chk_notation_translation_condition_kind CHECK (condition_kind IS NULL OR condition_kind IN ('install', 'defender_status'))");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.notation_translation DROP CONSTRAINT chk_notation_translation_condition_kind');
        $this->addSql('ALTER TABLE sf6.notation_translation DROP condition_value');
        $this->addSql('ALTER TABLE sf6.notation_translation DROP condition_kind');
    }
}
