<?php declare(strict_types=1);

namespace App\Service;

final class ComboNotationDictionaryTranslator
{
    public const DICTIONARY_NUMPAD = 'numpad';
    public const DICTIONARY_SF_SHORT = 'sf_short';

    /**
     * @return array<int, string>
     */
    public function supportedDictionaries(): array
    {
        return [self::DICTIONARY_NUMPAD, self::DICTIONARY_SF_SHORT];
    }

    public function normalizeDictionary(?string $dictionary): string
    {
        if (!is_string($dictionary)) {
            return self::DICTIONARY_NUMPAD;
        }

        $normalized = strtolower(trim($dictionary));

        return in_array($normalized, $this->supportedDictionaries(), true)
            ? $normalized
            : self::DICTIONARY_NUMPAD;
    }

    public function toNumpadNotation(string $notation, ?string $dictionary): string
    {
        $resolvedDictionary = $this->normalizeDictionary($dictionary);
        if (self::DICTIONARY_NUMPAD === $resolvedDictionary) {
            return trim($notation);
        }

        return $this->translateSfShortToNumpad($notation);
    }

    public function fromNumpadNotation(string $notation, ?string $dictionary): string
    {
        $resolvedDictionary = $this->normalizeDictionary($dictionary);
        if (self::DICTIONARY_NUMPAD === $resolvedDictionary) {
            return trim($notation);
        }

        $normalized = preg_replace('/\s+/', ' ', trim($notation)) ?? trim($notation);
        $tokens = preg_split('/[\s,]+/', $normalized);
        if (false === $tokens) {
            return trim($notation);
        }

        $mapped = [];
        foreach ($tokens as $token) {
            $token = trim($token);
            if ('' === $token) {
                continue;
            }

            $mapped[] = $this->fromNumpadToken($token);
        }

        return implode(' ', $mapped);
    }

    private function translateSfShortToNumpad(string $notation): string
    {
        $prepared = strtolower(trim($notation));
        $prepared = str_replace(['>', '~'], ' XX ', $prepared);
        $prepared = preg_replace('/\b(st|cr|j)\.\s*([lmh][pk]|[pk])\b/i', '$1.$2', $prepared) ?? $prepared;
        $prepared = preg_replace('/\b([fbud]{1,3}|qcf|qcb|hcf|hcb|srk|dp|dd|df|db)\s*\+\s*([lmh][pk]|[pk]|pp|kk)\b/i', '$1+$2', $prepared) ?? $prepared;
        $prepared = preg_replace('/\b(214214|236236|63214|41236|623|214|236|66|44|22|[12346789])\s+([lmh][pk]|[pk]|pp|kk)\b/i', '$1$2', $prepared) ?? $prepared;

        $tokens = preg_split('/[\s,]+/', $prepared);
        if (false === $tokens) {
            return trim($notation);
        }

        $mapped = [];
        foreach ($tokens as $token) {
            $token = trim($token);
            if ('' === $token) {
                continue;
            }

            if ('xx' === $token) {
                $mapped[] = 'XX';
                continue;
            }

            if ('tc' === $token) {
                $mapped[] = 'TC';
                continue;
            }

            $mapped[] = $this->toNumpadToken($token);
        }

        return implode(' ', $mapped);
    }

    private function toNumpadToken(string $token): string
    {
        if (preg_match('/^([lmh][pk])$/i', $token, $matches)) {
            return '5' . $this->normalizeButton($matches[1]);
        }

        if (preg_match('/^(st|cr|j)\.([lmh][pk]|[pk])$/i', $token, $matches)) {
            $direction = match (strtolower($matches[1])) {
                'st' => '5',
                'cr' => '2',
                'j' => '8',
                default => '5',
            };

            return $direction . $this->normalizeButton($matches[2]);
        }

        if (preg_match('/^(qcfx2|236x2)\+([lmh][pk]|[pk]|pp|kk)$/i', $token, $matches)) {
            return '236236' . $this->normalizeButton($matches[2]);
        }

        if (preg_match('/^(qcbx2|214x2)\+([lmh][pk]|[pk]|pp|kk)$/i', $token, $matches)) {
            return '214214' . $this->normalizeButton($matches[2]);
        }

        if (preg_match('/^(qcf|236)\+([lmh][pk]|[pk]|pp|kk)$/i', $token, $matches)) {
            return '236' . $this->normalizeButton($matches[2]);
        }

        if (preg_match('/^(qcb|214)\+([lmh][pk]|[pk]|pp|kk)$/i', $token, $matches)) {
            return '214' . $this->normalizeButton($matches[2]);
        }

        if (preg_match('/^(srk|dp|623)\+([lmh][pk]|[pk]|pp|kk)$/i', $token, $matches)) {
            return '623' . $this->normalizeButton($matches[2]);
        }

        if (preg_match('/^(hcf|41236)\+([lmh][pk]|[pk]|pp|kk)$/i', $token, $matches)) {
            return '41236' . $this->normalizeButton($matches[2]);
        }

        if (preg_match('/^(hcb|63214)\+([lmh][pk]|[pk]|pp|kk)$/i', $token, $matches)) {
            return '63214' . $this->normalizeButton($matches[2]);
        }

        if (preg_match('/^(f|b|df|db|dd)\+([lmh][pk]|[pk]|pp|kk)$/i', $token, $matches)) {
            return $this->toNumpadDirection($matches[1]) . $this->normalizeButton($matches[2]);
        }

        if (preg_match('/^(f|b|df|db|dd)$/i', $token, $matches)) {
            return $this->toNumpadDirection($matches[1]);
        }

        if (preg_match('/^[0-9]{1,6}([a-z]{1,3})?$/i', $token)) {
            return strtoupper($token);
        }

        return strtoupper($token);
    }

    private function fromNumpadToken(string $token): string
    {
        $upperToken = strtoupper(trim($token));

        if ('XX' === $upperToken || 'TC' === $upperToken || '360' === $upperToken || '720' === $upperToken) {
            return strtolower($upperToken);
        }

        if (preg_match('/^(236236|214214|41236|63214|623|236|214|22|3|1|4|6)([A-Z]{1,3})$/', $upperToken, $matches)) {
            return $this->directionToAlias($matches[1]) . '+' . strtolower($matches[2]);
        }

        if (preg_match('/^([1-9])([A-Z]{1,3})$/', $upperToken, $matches)) {
            $prefix = match ($matches[1]) {
                '5' => 'st.',
                '2' => 'cr.',
                default => $this->directionToAlias($matches[1]),
            };

            return $prefix . ' ' . strtolower($matches[2]);
        }

        if (preg_match('/^(236236|214214|41236|63214|623|236|214|22|3|1|4|6)$/', $upperToken, $matches)) {
            return $this->directionToAlias($matches[1]);
        }

        return strtolower($upperToken);
    }

    private function toNumpadDirection(string $direction): string
    {
        return match (strtolower(trim($direction))) {
            'f' => '6',
            'b' => '4',
            'df' => '3',
            'db' => '1',
            'dd' => '22',
            default => strtoupper(trim($direction)),
        };
    }

    private function directionToAlias(string $direction): string
    {
        return match ($direction) {
            '236236' => 'qcfx2',
            '214214' => 'qcbx2',
            '623' => 'srk',
            '236' => 'qcf',
            '214' => 'qcb',
            '41236' => 'hcf',
            '63214' => 'hcb',
            '22' => 'dd',
            '3' => 'df',
            '1' => 'db',
            '4' => 'b',
            '6' => 'f',
            default => strtolower($direction),
        };
    }

    private function normalizeButton(string $button): string
    {
        return match (strtolower(trim($button))) {
            'p' => 'P',
            'k' => 'K',
            'lp' => 'LP',
            'mp' => 'MP',
            'hp' => 'HP',
            'lk' => 'LK',
            'mk' => 'MK',
            'hk' => 'HK',
            'pp' => 'PP',
            'kk' => 'KK',
            default => strtoupper(trim($button)),
        };
    }
}
