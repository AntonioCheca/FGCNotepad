<?php declare(strict_types=1);

namespace App\Util\Enum;

enum MoveType: string
{
    case NORMAL = 'normal';
    case SPECIAL = 'special';
    case DRIVE = 'drive';
    case TAUNT = 'taunt';
    case FOLLOW_UP = 'follow-up';
    case SUPER = 'super';
    case THROW = 'throw';
    case OTHER = 'other';

    /**
     * @return array<string>
     */
    public static function getValues(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function isValid(string $value): bool
    {
        return in_array($value, self::getValues(), true);
    }

    public static function fromValueToString(string $value): string
    {
        if (self::isValid($value)) {
            return $value;
        }

        if ("" === $value) {
            return self::OTHER->value;
        }

        throw new \ValueError("\"$value\" is not a valid backing value for enum " . self::class);
    }
}