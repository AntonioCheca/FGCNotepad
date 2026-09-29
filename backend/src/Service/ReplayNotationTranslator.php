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
 *
 * Rules with a condition (an active install, a defender status on the hit) run only while it holds, on top of every
 * unconditional candidate, and those state-specific rewrites come first: an install move is preferred over the
 * regular one, which stays as the fallback when no install version exists.
 */
final class ReplayNotationTranslator
{
    /** @var list<array{characterId: string|null, kind: string, pattern: string, replacement: string, conditionKind: string|null, conditionValue: string|null}>|null */
    private ?array $rules = null;

    public function __construct(private readonly NotationTranslationRepository $repository)
    {
    }

    public function clearCache(): void
    {
        $this->rules = null;
    }

    /**
     * @param array{install?: bool, defenderStatus?: string|null} $state the combo's state when this move hit
     *
     * @return list<string> State-specific rewrites, then the notation itself, then each distinct rewrite of it.
     */
    public function candidates(string $notation, Character $character, array $state = []): array
    {
        $characterId = null !== $character->getId() ? (string) $character->getId() : null;
        $rules = $this->rulesFor($characterId);
        $unconditional = array_filter($rules, static fn (array $rule): bool => null === $rule['conditionKind']);
        $conditional = array_filter($rules, static fn (array $rule): bool => null !== $rule['conditionKind'] && self::holds($rule, $state));

        $candidates = [$notation];
        $current = $notation;
        foreach ($unconditional as $rule) {
            $next = self::apply($rule['kind'], $rule['pattern'], $rule['replacement'], $current);
            if ($next !== $current) {
                $current = $next;
                $candidates[] = $current;
            }
        }
        if ([] === $conditional) {
            return array_values(array_unique($candidates));
        }

        $stateSpecific = [];
        foreach ($candidates as $candidate) {
            $current = $candidate;
            foreach ($conditional as $rule) {
                $current = self::apply($rule['kind'], $rule['pattern'], $rule['replacement'], $current);
            }
            if ($current !== $candidate) {
                $stateSpecific[] = $current;
            }
        }

        return array_values(array_unique([...$stateSpecific, ...$candidates]));
    }

    /**
     * @param array{conditionKind: string|null, conditionValue: string|null} $rule
     * @param array{install?: bool, defenderStatus?: string|null} $state
     */
    private static function holds(array $rule, array $state): bool
    {
        return match ($rule['conditionKind']) {
            NotationTranslation::CONDITION_INSTALL => true === ($state['install'] ?? false),
            NotationTranslation::CONDITION_DEFENDER_STATUS => null !== $rule['conditionValue'] && $rule['conditionValue'] === ($state['defenderStatus'] ?? null),
            default => false,
        };
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

    /** @return list<array{characterId: string|null, kind: string, pattern: string, replacement: string, conditionKind: string|null, conditionValue: string|null}> */
    private function rulesFor(?string $characterId): array
    {
        if (null === $this->rules) {
            $this->rules = array_map(static fn (NotationTranslation $rule): array => [
                'characterId' => null !== $rule->getCharacter()?->getId() ? (string) $rule->getCharacter()->getId() : null,
                'kind' => $rule->getMatchKind(),
                'pattern' => $rule->getSourcePattern(),
                'replacement' => $rule->getReplacement(),
                'conditionKind' => $rule->getConditionKind(),
                'conditionValue' => $rule->getConditionValue(),
            ], $this->repository->findAllOrdered());
        }

        $own = array_filter($this->rules, static fn (array $rule): bool => null !== $characterId && $rule['characterId'] === $characterId);
        $global = array_filter($this->rules, static fn (array $rule): bool => null === $rule['characterId']);

        return [...array_values($own), ...array_values($global)];
    }
}
