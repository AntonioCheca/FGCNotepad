<?php declare(strict_types=1);

namespace App\Util\Enum;

enum UserRole: string
{
    case USER = 'ROLE_USER';
    case MODERATOR = 'ROLE_MODERATOR';
    case ADMIN = 'ROLE_ADMIN';
}
