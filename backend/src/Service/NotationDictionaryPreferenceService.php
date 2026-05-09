<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\User;
use Symfony\Component\HttpFoundation\Request;

final class NotationDictionaryPreferenceService
{
    private const QUERY_KEY = 'notationDictionary';
    private const HEADER_KEY = 'X-Notation-Dictionary';

    public function __construct(
        private readonly ComboNotationDictionaryTranslator $dictionaryTranslator,
    ) {
    }

    public function resolveForRequest(Request $request, ?User $user): string
    {
        $rawHeader = $request->headers->get(self::HEADER_KEY);
        if (is_string($rawHeader) && '' !== trim($rawHeader)) {
            return $this->dictionaryTranslator->normalizeDictionary($rawHeader);
        }

        $rawQuery = $request->query->get(self::QUERY_KEY);
        if (is_string($rawQuery) && '' !== trim($rawQuery)) {
            return $this->dictionaryTranslator->normalizeDictionary($rawQuery);
        }

        return $this->resolveForUser($user);
    }

    public function resolveForUser(?User $user): string
    {
        $stored = $user?->getScenarioPreference()?->getNotationDictionary();

        return $this->dictionaryTranslator->normalizeDictionary($stored);
    }
}
