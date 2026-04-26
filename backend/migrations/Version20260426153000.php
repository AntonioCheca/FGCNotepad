<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260426153000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add user account deactivation fields';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE forum."user" ADD is_active BOOLEAN DEFAULT TRUE NOT NULL');
        $this->addSql('ALTER TABLE forum."user" ADD deactivated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('CREATE INDEX IDX_USER_IS_ACTIVE ON forum."user" (is_active)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX IDX_USER_IS_ACTIVE');
        $this->addSql('ALTER TABLE forum."user" DROP is_active');
        $this->addSql('ALTER TABLE forum."user" DROP deactivated_at');
    }
}
