<?php declare(strict_types=1);

namespace App\Service;

final class ComboStarterModifierExtractor
{
    public const STARTER_HIT_STATE_PUNISH_COUNTER = 'punish_counter';
    public const STARTER_HIT_STATE_COUNTER_HIT = 'counter_hit';

    private const PERFECT_PARRY_PATTERNS = [
        '/^\s*(?:\(\s*(?:PP|PERFECT\s+PARRY)\s*\)|(?:PP|PERFECT\s+PARRY))(?:\s*[+>,]\s*|\s+)/iu',
        '/^(.+?)\s*\(\s*(?:PP|PERFECT\s+PARRY)\s*\)(?=\s*(?:,|$))/iu',
    ];

    /**
     * @return array{notation:string,starterHitState:string|null,perfectParry:bool,requirements:array{counter_hit_required:bool,punish_counter_required:bool,perfect_parry_required:bool}}
     */
    public function extract(string $notation): array
    {
        [$cleanNotation, $perfectParry] = $this->extractPerfectParry(trim($notation));
        $state = null;

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

        if ($perfectParry) {
            $state = self::STARTER_HIT_STATE_PUNISH_COUNTER;
        }

        return [
            'notation' => $cleanNotation,
            'starterHitState' => $state,
            'perfectParry' => $perfectParry,
            'requirements' => [
                'counter_hit_required' => self::STARTER_HIT_STATE_COUNTER_HIT === $state,
                'punish_counter_required' => self::STARTER_HIT_STATE_PUNISH_COUNTER === $state,
                'perfect_parry_required' => $perfectParry,
            ],
        ];
    }

    /**
     * A punish after a Perfect Parry always lands as a Punish Counter, so the PP tag implies PC.
     *
     * @return array{0:string,1:bool}
     */
    private function extractPerfectParry(string $notation): array
    {
        foreach (self::PERFECT_PARRY_PATTERNS as $pattern) {
            $updated = preg_replace($pattern, '$1', $notation, 1, $count);
            if (is_string($updated) && $count > 0) {
                return [trim($updated), true];
            }
        }

        return [$notation, false];
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
