<?php declare(strict_types=1);

namespace App\Util;

class MixedValidator
{
    public static function validateMixedValueIsString(mixed $mixedValue, string $message): void
    {
        if (!is_string($mixedValue)) {
            throw new \ValueError($message);
        }
    }

    public static function validateMixedValueIsInteger(mixed $mixedValue, string $message): void
    {
        if (!is_integer($mixedValue)) {
            throw new \ValueError($message);
        }
    }

    public static function validateMixedValueIsArray(mixed $mixedValue, string $message): void
    {
        if (!is_array($mixedValue)) {
            throw new \ValueError($message);
        }
    }
}