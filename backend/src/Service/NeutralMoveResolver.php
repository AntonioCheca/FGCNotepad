<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Character;
use App\Util\MoveNotationAliases;
use App\Util\ReplayMoveNotation;
use Doctrine\DBAL\Connection;

/**
 * Resolves an exported neutral move notation ("236+LK", "[4]6+HP", "j.HP") to the character's catalogue move id
 * through numpad notation. Different strengths and command normals stay different moves.
 */
final class NeutralMoveResolver
{
    /** @var array<string, array<string, string>> character id => notation key => move id */
    private array $movesByCharacter = [];

    public function __construct(private readonly Connection $connection)
    {
    }

    public function clearCache(): void
    {
        $this->movesByCharacter = [];
    }

    public function resolve(Character $character, string $notation): ?string
    {
        $moves = $this->movesFor($character);
        $key = ReplayMoveNotation::key($notation);
        if (isset($moves[$key])) {
            return $moves[$key];
        }

        $jumpKey = ReplayMoveNotation::jumpAliasKey($key);

        return null === $jumpKey ? null : ($moves[$jumpKey] ?? null);
    }

    /** @return array<string, string> */
    private function movesFor(Character $character): array
    {
        $characterId = (string) $character->getId();
        if (isset($this->movesByCharacter[$characterId])) {
            return $this->movesByCharacter[$characterId];
        }

        $rows = $this->connection->fetchAllAssociative(
            'SELECT id, numpad_notation FROM sf6.move WHERE character_id = :characterId ORDER BY numpad_notation, id',
            ['characterId' => $characterId],
        );

        $byKey = [];
        foreach ($rows as $row) {
            $notation = (string) $row['numpad_notation'];
            foreach ([$notation, ...MoveNotationAliases::alternatives($notation)] as $alias) {
                $byKey[ReplayMoveNotation::key($alias)] ??= (string) $row['id'];
            }
        }

        return $this->movesByCharacter[$characterId] = $byKey;
    }
}
