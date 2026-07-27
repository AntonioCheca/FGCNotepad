<?php declare(strict_types=1);

namespace App\Service;

final class ComboStarterModifierExtractor
{
    public const STARTER_HIT_STATE_PUNISH_COUNTER = 'punish_counter';
    public const STARTER_HIT_STATE_COUNTER_HIT = 'counter_hit';

    /**
     * @return array{notation:string,starterHitState:string|null,requirements:array{counter_hit_required:bool,punish_counter_required:bool}}
     */
    public function extract(string $notation): array
    {
        $state = null;
        $cleanNotation = trim($notation);

        foreach ($this->patternsByState() as $nextState => $patterns) {
            foreach ($patterns as $pattern) {
                $updated = preg_replace($pattern, '$1', $cleanNotation, 1, $count);
                if (is_string($updated) && $count > 0) {
                    $state = $nextState;
                    $cleanNotation = trim($updated);
                    break 2;
                }
            }
        }

        return [
            'notation' => $cleanNotation,
            'starterHitState' => $state,
            'requirements' => [
                'counter_hit_required' => self::STARTER_HIT_STATE_COUNTER_HIT === $state,
                'punish_counter_required' => self::STARTER_HIT_STATE_PUNISH_COUNTER === $state,
            ],
        ];
    }

    /**
     * @return array<string, list<string>>
     */
    private function patternsByState(): array
    {
        return [
            self::STARTER_HIT_STATE_PUNISH_COUNTER => [
                '/^\s*(?:\(\s*(?:PC|PUNISH\s+COUNTER)\s*\)|(?:PC|PUNISH\s+COUNTER))\s+/iu',
                '/^(.+?)\s*(?:\(\s*(?:PC|PUNISH\s+COUNTER)\s*\)|(?:PC|PUNISH\s+COUNTER))(?=\s*(?:,|$))/iu',
            ],
            self::STARTER_HIT_STATE_COUNTER_HIT => [
                '/^\s*(?:\(\s*(?:CH|COUNTER\s+HIT)\s*\)|(?:CH|COUNTER\s+HIT))\s+/iu',
                '/^(.+?)\s*(?:\(\s*(?:CH|COUNTER\s+HIT)\s*\)|(?:CH|COUNTER\s+HIT))(?=\s*(?:,|$))/iu',
            ],
        ];
    }
}
