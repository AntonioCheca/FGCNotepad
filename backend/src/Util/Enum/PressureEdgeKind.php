<?php declare(strict_types=1);

namespace App\Util\Enum;

/**
 * Semantic transition types shared by oki and blockstring pressure graphs.
 * normal = autopilot/tight, confirm = react to something observable,
 * read = hard read on the opponent, fake = interruptible/exploitable.
 */
enum PressureEdgeKind: string
{
    case NORMAL = 'normal';
    case CONFIRM = 'confirm';
    case READ = 'read';
    case FAKE = 'fake';
}
