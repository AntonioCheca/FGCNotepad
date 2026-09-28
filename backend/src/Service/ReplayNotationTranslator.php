<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Character;
use App\Entity\NotationTranslation;
use App\Repository\NotationTranslationRepository;
use App\Util\ReplayMoveNotation;

/**
 * Rewrites a replay-export notation towards the catalogue's notation using the rules in `notation_translation`.
 *
 * Rules run as one pipeline: the character's own rules first, then rules for every character, each group by
 * priority. Every rule works on the output of the previous one, so a separator rule and a qualifier rule combine.
 * Each change adds a candidate; callers try the candidates in order, the untouched notation first.
 */
final class ReplayNotationTranslator
{
    /** @var list<array{characterId: string|null, kind: string, pattern: string, replacement: string}>|null */
    private ?array $rules = null;

    public function __construct(private readonly NotationTranslationRepository $repository)
    {
    }

    public function clearCache(): void
    {
        $this->rules = null;
    }

    /** @return list<string> The notation itself, then each distinct rewrite of it. */
    public function candidates(string $notation, Character $character): array
    {
        $characterId = null !== $character->getId() ? (string) $character->getId() : null;
        $candidates = [$notation];
        $current = $notation;

        foreach ($this->rulesFor($characterId) as $rule) {
            $next = self::apply($rule['kind'], $rule['pattern'], $rule['replacement'], $current);
            if ($next === $current) {
                continue;
            }
            $current = $next;
            if (!in_array($current, $candidates, true)) {
                $candidates[] = $current;
            }
        }

        return $candidates;
    }

    /** Exact rules compare notation keys, so spacing, "+" and charge brackets do not matter. */
    public static function apply(string $kind, string $pattern, string $replacement, string $notation): string
    {
        if (NotationTranslation::KIND_EXACT === $kind) {
            return ReplayMoveNotation::key($pattern) === ReplayMoveNotation::key($notation) ? $replacement : $notation;
        }

        $result = preg_replace(self::regex($pattern), $replacement, $notation);

        return is_string($result) ? trim($result) : $notation;
    }

    /** Patterns are stored without delimiters; braces never clash with the "~" and "/" used in notations. */
    public static function regex(string $pattern): string
    {
        return '{' . $pattern . '}u';
    }

    public static function isValidRegex(string $pattern): bool
    {
        return false !== @preg_match(self::regex($pattern), '');
    }

    /** @return list<array{characterId: string|null, kind: string, pattern: string, replacement: string}> */
    private function rulesFor(?string $characterId): array
    {
        if (null === $this->rules) {
            $this->rules = array_map(static fn (NotationTranslation $rule): array => [
                'characterId' => null !== $rule->getCharacter()?->getId() ? (string) $rule->getCharacter()->getId() : null,
                'kind' => $rule->getMatchKind(),
                'pattern' => $rule->getSourcePattern(),
                'replacement' => $rule->getReplacement(),
            ], $this->repository->findAllOrdered());
        }

        $own = array_filter($this->rules, static fn (array $rule): bool => null !== $characterId && $rule['characterId'] === $characterId);
        $global = array_filter($this->rules, static fn (array $rule): bool => null === $rule['characterId']);

        return [...array_values($own), ...array_values($global)];
    }
}
