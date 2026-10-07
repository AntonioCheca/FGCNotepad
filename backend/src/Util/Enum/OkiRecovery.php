<?php declare(strict_types=1);

namespace App\Util\Enum;

/** Defender wake-up option a step is meant for; only used on backroll-dependent setups. */
enum OkiRecovery: string
{
    case BACKROLL = 'BACKROLL';
    case RISE_IN_PLACE = 'RISE_IN_PLACE';
}
