<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260921120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Data only: rewrite FAT-style "4 or 6MP" move notations as "4MP or 6MP" (moves and their leaf sequences)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("UPDATE sf6.move SET numpad_notation = regexp_replace(numpad_notation, '^(\\d) or (\\d) or (\\d)([+A-Za-z]+)$', '\\1\\4 or \\2\\4 or \\3\\4') WHERE numpad_notation ~ '^\\d or \\d or \\d[+A-Za-z]+$'");
        $this->addSql("UPDATE sf6.move SET numpad_notation = regexp_replace(numpad_notation, '^(\\d) or (\\d)([+A-Za-z]+)$', '\\1\\3 or \\2\\3') WHERE numpad_notation ~ '^\\d or \\d[+A-Za-z]+$'");
        $this->addSql("UPDATE sf6.combo_sequence cs SET name = c.name || ' - ' || m.numpad_notation, description = 'Leaf move: ' || c.name || ' - ' || m.numpad_notation FROM sf6.move m JOIN sf6.character c ON c.id = m.character_id WHERE cs.move_id = m.id AND m.numpad_notation ~ '^\\d[+A-Za-z]* or \\d[+A-Za-z]*( or \\d[+A-Za-z]*)?$'");
    }

    public function down(Schema $schema): void
    {
        $this->throwIrreversibleMigrationException('The original FAT spelling is not recoverable.');
    }
}
