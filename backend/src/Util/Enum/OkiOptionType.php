<?php declare(strict_types=1);

namespace App\Util\Enum;

enum OkiOptionType: string
{
    case STRIKE = 'STRIKE';
    case MEATY_STRIKE = 'MEATY_STRIKE';
    case MEATY_THROW = 'MEATY_THROW';
    case SHIMMY = 'SHIMMY';
    case DELAY_STRIKE = 'DELAY_STRIKE';
    case DELAY_THROW = 'DELAY_THROW';

    public static function isValid(string $value): bool
    {
        return null !== self::tryFrom($value);
    }
}
