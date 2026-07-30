<?php declare(strict_types=1);

namespace App\Util\Enum;

enum OkiNodePropertyType: string
{
    case OVERHEAD = 'OVERHEAD';
    case LOW = 'LOW';
    case LEFT_RIGHT = 'LEFT_RIGHT';
    case SAFE_JUMP = 'SAFE_JUMP';
    case FAKE_SAFE_JUMP = 'FAKE_SAFE_JUMP';
    case REVERSAL_BAIT = 'REVERSAL_BAIT';
    case ANTI_DRIVE_REVERSAL = 'ANTI_DRIVE_REVERSAL';
    case CHARACTER_SPECIFIC = 'CHARACTER_SPECIFIC';

    public static function isValid(string $value): bool
    {
        return null !== self::tryFrom($value);
    }
}
