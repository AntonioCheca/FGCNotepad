<?php declare(strict_types=1);

namespace App\Util;

/**
 * Moves reachable by more than one input (Chun-Li 4MP / 6MP) are stored as one notation, "4MP or 6MP".
 * Every alternative is a complete notation, so "4 or 6MP" (which could read as a bare "4") is never stored.
 */
final class MoveNotationAliases
{
    private const SEPARATOR = ' or ';

    /** FAT writes "4 or 6MP"; the catalogue stores "4MP or 6MP". Any other shape is returned untouched. */
    public static function canonicalize(string $notation): string
    {
        $trimmed = trim($notation);
        if (1 !== preg_match('/^(\d(?: or \d)+)([+A-Za-z]+)$/', $trimmed, $matches)) {
            return $trimmed;
        }

        return implode(self::SEPARATOR, array_map(static fn (string $direction): string => $direction . $matches[2], explode(self::SEPARATOR, $matches[1])));
    }

    /**
     * The individual notations of a "4MP or 6MP" move; empty for ordinary moves and for compound rows such as
     * "5HP or 5HK (Monoid)" or "236LPMP or LPHP" whose parts are not standalone notations.
     *
     * @return list<string>
     */
    public static function alternatives(string $notation): array
    {
        $parts = array_map('trim', explode(self::SEPARATOR, $notation));
        if (count($parts) < 2) {
            return [];
        }
        foreach ($parts as $part) {
            if (1 !== preg_match('/^\d[+A-Za-z]*$/', $part)) {
                return [];
            }
        }

        return $parts;
    }
}
