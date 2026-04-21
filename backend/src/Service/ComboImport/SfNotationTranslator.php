<?php declare(strict_types=1);

namespace App\Service\ComboImport;

final class SfNotationTranslator
{
    /**
     * @return array{
     *   normalizedNotation:string,
     *   warnings:array<int,string>,
     *   unknownTokens:array<int,string>
     * }
     */
    public function translate(string $comboText): array
    {
        $warnings = [];
        $unknownTokens = [];

        $prepared = strtolower(trim($comboText));
        $prepared = preg_replace('/\((pc|crush|stun|air|held|partial|blocked)\)/i', ' ', $prepared) ?? $prepared;
        $prepared = str_replace(['>', '~'], ',', $prepared);
        $prepared = preg_replace('/\s+xx\s+/i', ' XX ', $prepared) ?? $prepared;
        $prepared = preg_replace('/\s*XX\s*/', ',XX,', $prepared) ?? $prepared;
        $prepared = preg_replace('/\s+/', ' ', $prepared) ?? $prepared;

        $chunks = preg_split('/\s*,\s*/', $prepared);
        if (false === $chunks || null === $chunks) {
            return [
                'normalizedNotation' => '',
                'warnings' => ['Unable to split combo text into tokens.'],
                'unknownTokens' => [$comboText],
            ];
        }

        $tokens = [];
        foreach ($chunks as $chunk) {
            $chunk = trim($chunk);
            if ('' === $chunk) {
                continue;
            }

            if ('xx' === strtolower($chunk)) {
                $tokens[] = 'XX';
                continue;
            }

            $normalized = $this->translateToken($chunk);
            if (null === $normalized) {
                $unknownTokens[] = $chunk;
                continue;
            }

            $tokens[] = $normalized;
        }

        if ([] !== $unknownTokens) {
            $warnings[] = sprintf('Unknown SF notation token(s): %s', implode(', ', $unknownTokens));
        }

        return [
            'normalizedNotation' => implode(', ', $tokens),
            'warnings' => $warnings,
            'unknownTokens' => $unknownTokens,
        ];
    }

    private function translateToken(string $token): ?string
    {
        $token = trim(strtolower($token));

        if ('' === $token) {
            return null;
        }

        if (preg_match('/^n\.j\s+j\.\s*([lmphk]{2}|[lmphk])$/i', $token, $matches)) {
            return '8' . strtoupper($this->normalizeButton($matches[1]));
        }

        if (preg_match('/^(st|cr|j)\.\s*([lmphk]{2}|[lmphk])$/i', $token, $matches)) {
            $direction = match (strtolower($matches[1])) {
                'st' => '5',
                'cr' => '2',
                'j' => '8',
                default => '5',
            };

            return $direction . strtoupper($this->normalizeButton($matches[2]));
        }

        if (preg_match('/^(f|b|df|db|uf|ub)\+([lmphk]{2}|[lmphk])$/i', $token, $matches)) {
            $direction = match (strtolower($matches[1])) {
                'f' => '6',
                'b' => '4',
                'df' => '3',
                'db' => '1',
                'uf' => '9',
                'ub' => '7',
                default => '5',
            };

            return $direction . strtoupper($this->normalizeButton($matches[2]));
        }

        if ('dr' === $token) {
            return 'DR';
        }

        if ('di' === $token || str_starts_with($token, 'di ')) {
            return 'DI';
        }

        if (preg_match('/^(qcf|236)\+([lmphk]{2}|[lmphk]|pp|kk)$/i', $token, $matches)) {
            return '236' . strtoupper($this->normalizeButton($matches[2]));
        }

        if (preg_match('/^(qcb|214)\+([lmphk]{2}|[lmphk]|pp|kk)$/i', $token, $matches)) {
            return '214' . strtoupper($this->normalizeButton($matches[2]));
        }

        if (preg_match('/^(srk|dp|623)\+([lmphk]{2}|[lmphk]|pp|kk)$/i', $token, $matches)) {
            return '623' . strtoupper($this->normalizeButton($matches[2]));
        }

        if (preg_match('/^(hcf|41236)\+([lmphk]{2}|[lmphk]|pp|kk)$/i', $token, $matches)) {
            return '41236' . strtoupper($this->normalizeButton($matches[2]));
        }

        if (preg_match('/^(hcb|63214)\+([lmphk]{2}|[lmphk]|pp|kk)$/i', $token, $matches)) {
            return '63214' . strtoupper($this->normalizeButton($matches[2]));
        }

        if (preg_match('/^(qcf|236)x2\+([lmphk]{2}|[lmphk]|pp|kk)$/i', $token, $matches)) {
            return '236236' . strtoupper($this->normalizeButton($matches[2]));
        }

        if (preg_match('/^(qcb|214)x2\+([lmphk]{2}|[lmphk]|pp|kk)$/i', $token, $matches)) {
            return '214214' . strtoupper($this->normalizeButton($matches[2]));
        }

        if (preg_match('/^\d{1,6}[a-z]{1,3}$/i', $token)) {
            return strtoupper($token);
        }

        return null;
    }

    private function normalizeButton(string $button): string
    {
        $normalized = strtolower(trim($button));

        return match ($normalized) {
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
            default => strtoupper($normalized),
        };
    }
}
