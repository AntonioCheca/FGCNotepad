<?php declare(strict_types=1);

namespace App\Service;

final class NotationCanonicalizer
{
    public function __construct(
        private readonly ComboNotationDictionaryTranslator $dictionaryTranslator,
    ) {
    }

    /**
     * @return array{
     *   canonicalNotation:string,
     *   rawTokens:array<int, string>,
     *   canonicalTokens:array<int, string>,
     *   tokenMap:array<int, array{index:int, rawToken:string, canonicalToken:string}>
     * }
     */
    public function canonicalize(string $notation): array
    {
        $rawTokens = $this->tokenizeRawNotation($notation);
        $canonicalNotation = $this->dictionaryTranslator->toNumpadNotation($notation, ComboNotationDictionaryTranslator::DICTIONARY_SF_SHORT);
        $canonicalTokens = $this->tokenizeRawNotation($canonicalNotation);

        $tokenMap = [];
        $max = max(count($rawTokens), count($canonicalTokens));
        for ($i = 0; $i < $max; ++$i) {
            $tokenMap[] = [
                'index' => $i + 1,
                'rawToken' => $rawTokens[$i] ?? '',
                'canonicalToken' => $canonicalTokens[$i] ?? '',
            ];
        }

        return [
            'canonicalNotation' => $canonicalNotation,
            'rawTokens' => $rawTokens,
            'canonicalTokens' => $canonicalTokens,
            'tokenMap' => $tokenMap,
        ];
    }

    /**
     * @return array<int, string>
     */
    private function tokenizeRawNotation(string $notation): array
    {
        $prepared = str_replace(['>', '~'], ' XX ', trim($notation));
        $prepared = preg_replace('/\s+/', ' ', $prepared) ?? $prepared;
        $tokens = preg_split('/[\s,]+/', $prepared);

        if (false === $tokens) {
            return [];
        }

        return array_values(array_filter(array_map(static fn (string $token): string => trim($token), $tokens), static fn (string $token): bool => '' !== $token));
    }
}
