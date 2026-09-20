<?php declare(strict_types=1);

namespace App\Util;

/**
 * Bridges the notation used by replay exports and the one stored in the move catalogue.
 *
 * Exports write specials as "236+HP" and jumping normals as "j.HP"; the catalogue stores "236HP" and "8HP".
 * Charge moves are written "[2]8+LK" against the catalogue's "28LK".
 * Comparison therefore happens on a key that ignores case, whitespace, "+" and charge brackets.
 */
final class ReplayMoveNotation
{
    public static function key(string $notation): string
    {
        return strtoupper((string) preg_replace('/[\s+\[\]]+/', '', $notation));
    }

    /** "j.HP" -> the neutral-jump key "8HP". Null when the key is not a plain jumping normal. */
    public static function jumpAliasKey(string $key): ?string
    {
        return 1 === preg_match('/^J\.([LMH][PK])$/', $key, $matches) ? '8' . $matches[1] : null;
    }

    /** "214P" / "236K": the extractor could not tell the strength, so no single catalogue move corresponds. */
    public static function isStrengthAgnostic(string $key): bool
    {
        return 1 === preg_match('/^\d+[PK]$/', $key);
    }

    public static function characterKey(string $name): string
    {
        return strtolower((string) preg_replace('/[^a-z0-9]/i', '', $name));
    }
}
