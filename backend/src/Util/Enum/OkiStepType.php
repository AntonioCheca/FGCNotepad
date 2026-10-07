<?php declare(strict_types=1);

namespace App\Util\Enum;

enum OkiStepType: string
{
    case IMMEDIATE = 'IMMEDIATE';
    case DELAY = 'DELAY';
}
