<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ReplayAnnotation;

final class ReplayLabCategoryCatalog
{
    /**
     * @var list<string>
     */
    private const MEMORY_CATEGORIES = [
        'frame_trap',
        'spacing_trap',
        'negative_on_block',
        'reactable_gap',
        'non_reactable_gap_rps',
        'bad_oki_defense_choice',
        'custom_memory',
    ];

    /**
     * @var list<string>
     */
    private const TASK_CATEGORIES = [
        'dropped_combo',
        'missing_input',
        'mistimed_oki',
        'missed_anti_air',
        'custom_task',
    ];

    public function isValidEventKind(string $eventKind): bool
    {
        return in_array($eventKind, [ReplayAnnotation::EVENT_KIND_MEMORY, ReplayAnnotation::EVENT_KIND_TASK], true);
    }

    public function isValidCategory(string $eventKind, string $category): bool
    {
        return in_array($category, $this->categoriesFor($eventKind), true);
    }

    /**
     * @return list<string>
     */
    public function categoriesFor(string $eventKind): array
    {
        return match ($eventKind) {
            ReplayAnnotation::EVENT_KIND_MEMORY => self::MEMORY_CATEGORIES,
            ReplayAnnotation::EVENT_KIND_TASK => self::TASK_CATEGORIES,
            default => [],
        };
    }
}
