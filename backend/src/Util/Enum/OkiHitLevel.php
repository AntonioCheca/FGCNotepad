<?php declare(strict_types=1);

namespace App\Util\Enum;

/** Only the levels a defender must react to; mid is the unstored default. */
enum OkiHitLevel: string
{
    case LOW = 'LOW';
    case OVERHEAD = 'OVERHEAD';
}
