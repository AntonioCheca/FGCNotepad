<?php declare(strict_types=1);

namespace App\Util\Enum;

enum ReversalType: string
{
    case OD_REVERSAL = 'OD_REVERSAL';
    case SUPER = 'SUPER';
    case COMMAND_REVERSAL = 'COMMAND_REVERSAL';
    case OTHER = 'OTHER';

    public static function isValid(string $value): bool
    {
        return null !== self::tryFrom($value);
    }
}
