<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261009150000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Records which Terms of Use version each user accepted and when they requested account deletion';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE forum."user" ADD terms_accepted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE forum."user" ADD terms_version VARCHAR(32) DEFAULT NULL');
        $this->addSql('ALTER TABLE forum."user" ADD deletion_requested_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE forum."user" DROP terms_accepted_at');
        $this->addSql('ALTER TABLE forum."user" DROP terms_version');
        $this->addSql('ALTER TABLE forum."user" DROP deletion_requested_at');
    }
}
