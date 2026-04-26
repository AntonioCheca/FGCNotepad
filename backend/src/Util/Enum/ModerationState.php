<?php declare(strict_types=1);

namespace App\Util\Enum;

enum ModerationState: string
{
    case PENDING_REVIEW = 'pending_review';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';
    case HIDDEN = 'hidden';

    public static function isValid(string $value): bool
    {
        return null !== self::tryFrom($value);
    }
}
