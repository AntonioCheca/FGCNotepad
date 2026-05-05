<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260505221500 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add life column to characters with SF6 defaults';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.character ADD life INT DEFAULT 10000 NOT NULL');
        $this->addSql("UPDATE sf6.character SET life = 9000 WHERE name = 'Akuma'");
        $this->addSql("UPDATE sf6.character SET life = 10500 WHERE name IN ('Marisa', 'E.Honda')");
        $this->addSql("UPDATE sf6.character SET life = 11000 WHERE name = 'Zangief'");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sf6.character DROP life');
    }
}
