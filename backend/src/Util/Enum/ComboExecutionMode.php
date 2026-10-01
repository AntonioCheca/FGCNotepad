<?php declare(strict_types=1);

namespace App\Util\Enum;

enum ComboExecutionMode: string
{
    case CLASSIC = 'classic';
    case MODERN_MAX = 'modern_max';
    case MODERN_SIMPLE = 'modern_simple';

    public function isModern(): bool
    {
        return self::CLASSIC !== $this;
    }

    public static function fromNullable(?string $value): ?self
    {
        return null === $value ? null : self::tryFrom(mb_strtolower(trim($value)));
    }
}
