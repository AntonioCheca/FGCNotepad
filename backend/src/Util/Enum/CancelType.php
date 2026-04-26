<?php declare(strict_types=1);

namespace App\Util\Enum;

enum CancelType: string
{
    case CHAIN = 'ch';
    case SPECIAL = 'sp';
    case SUPER_3 = 'su3';
    case SUPER_2 = 'su2';
    case TARGET_COMBO = 'tc';
    case SUPER_JUMP = 'sj';
    case SUPER = 'su';
    case SERENITY_STREAM = 'ss';
    case JUMP = 'j';

    public static function tryFromCode(string $value): ?self
    {
        return self::tryFrom(strtolower(trim($value)));
    }
}
