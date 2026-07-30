<?php declare(strict_types=1);

namespace App\Util\Enum;

enum ReversalPropertyType: string
{
    case STRIKE_INVULNERABLE = 'STRIKE_INVULNERABLE';
    case THROW_INVULNERABLE = 'THROW_INVULNERABLE';
    case HITS_CROUCHING = 'HITS_CROUCHING';
    case WHIFFS_AGAINST_CROUCHING = 'WHIFFS_AGAINST_CROUCHING';
    case AIR_INVULNERABLE = 'AIR_INVULNERABLE';

    public static function isValid(string $value): bool
    {
        return null !== self::tryFrom($value);
    }
}
