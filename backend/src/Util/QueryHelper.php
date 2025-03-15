<?php declare(strict_types=1);

namespace App\Util;

class QueryHelper
{
    public const QUOTE_FOR_POSTGRES_STRINGS = "'";

    public static function quoteStringForQuery(string $string): string
    {
        return sprintf("%s%s%s", self::QUOTE_FOR_POSTGRES_STRINGS, $string, self::QUOTE_FOR_POSTGRES_STRINGS);
    }
}