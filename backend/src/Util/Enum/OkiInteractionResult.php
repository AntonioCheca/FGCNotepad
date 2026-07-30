<?php declare(strict_types=1);

namespace App\Util\Enum;

enum OkiInteractionResult: string
{
    case WINS = 'WINS';
    case LOSES = 'LOSES';
    case NEUTRAL = 'NEUTRAL';
    case TRADES = 'TRADES';

    public static function isValid(string $value): bool
    {
        return null !== self::tryFrom($value);
    }
}
