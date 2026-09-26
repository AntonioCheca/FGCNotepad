<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\NeutralObservation;

/**
 * Neutral Distribution families. Drive Rush routes are their own family whatever the move; normals (command normals
 * included) split by button strength; specials and supers are Specials, with OD versions flagged; universal
 * mechanics (throws, Drive Impact, Parry...) are Miscellaneous.
 */
final class NeutralMoveFamilyClassifier
{
    public const LIGHT = 'light';
    public const MEDIUM = 'medium';
    public const HEAVY = 'heavy';
    public const DRIVE_RUSH = 'drive_rush';
    public const SPECIAL = 'special';
    public const MISC = 'misc';
    public const OTHER = 'other';

    /** Bottom-to-top stack order, also the legend order. */
    public const ORDER = [self::LIGHT, self::MEDIUM, self::HEAVY, self::DRIVE_RUSH, self::SPECIAL, self::MISC, self::OTHER];

    private const STRENGTHS = ['L' => self::LIGHT, 'M' => self::MEDIUM, 'H' => self::HEAVY];

    public function family(string $route, string $notation, ?string $moveType, ?string $catalogueCategory): string
    {
        if (NeutralObservation::ROUTE_DRIVE_RUSH === $route) {
            return self::DRIVE_RUSH;
        }

        $kind = $moveType ?? match ($catalogueCategory) {
            'special_move' => 'special',
            'normal_command_or_contextual' => 'normal',
            default => null,
        };

        return match ($kind) {
            'normal' => $this->strengthFamily($notation),
            'special', 'super' => self::SPECIAL,
            default => self::MISC,
        };
    }

    public function isOd(string $family, string $notation): bool
    {
        return self::SPECIAL === $family && 1 === preg_match('/PP|KK/', strtoupper($notation));
    }

    private function strengthFamily(string $notation): string
    {
        if (1 !== preg_match('/([LMH])[PK]/', strtoupper($notation), $matches)) {
            return self::MISC;
        }

        return self::STRENGTHS[$matches[1]];
    }
}
