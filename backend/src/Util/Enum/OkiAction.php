<?php declare(strict_types=1);

namespace App\Util\Enum;

/** Universal attacker actions an oki node can hold instead of a character move. */
enum OkiAction: string
{
    case BLOCK = 'BLOCK';
    case SHIMMY = 'SHIMMY';
    case WALK_FORWARD = 'WALK_FORWARD';
    case WALK_BACKWARD = 'WALK_BACKWARD';
    case NEUTRAL_JUMP = 'NEUTRAL_JUMP';
    case FORWARD_JUMP = 'FORWARD_JUMP';
    case BACK_JUMP = 'BACK_JUMP';
    case BACKDASH = 'BACKDASH';
}
