<?php declare(strict_types=1);

namespace App\Util\Enum;

enum OkiStepType: string
{
    case IMMEDIATE = 'IMMEDIATE';
    case WALK_FORWARD = 'WALK_FORWARD';
    case WALK_BACKWARD = 'WALK_BACKWARD';
    case WAIT = 'WAIT';

    public static function isValid(string $value): bool
    {
        return null !== self::tryFrom($value);
    }
}
