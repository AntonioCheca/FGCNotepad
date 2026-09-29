<?php declare(strict_types=1);

namespace App\Service;

/**
 * Reads the combo state that selects a move variant from a combo export: whether an install was active when the
 * combo started, and the defender's timed status (a poison, an infection…) just before each move's first hit.
 */
final class ReplayComboStateReader
{
    /**
     * @param array<string, mixed> $combo
     *
     * @return array{install: bool, defenderStatusByIndex: array<int, string>} defender status keyed by sequence index
     */
    public function read(array $combo): array
    {
        $install = $combo['resources_at_start']['install']['active'] ?? null;

        $starts = [];
        foreach (is_array($combo['sequence'] ?? null) ? $combo['sequence'] : [] as $index => $step) {
            if (is_array($step) && is_int($step['start_source_index'] ?? null)) {
                $starts[$index] = $step['start_source_index'];
            }
        }

        $defenderStatusByIndex = [];
        foreach (is_array($combo['contact_evidence'] ?? null) ? $combo['contact_evidence'] : [] as $contact) {
            $kind = is_array($contact) ? ($contact['defender_status_effect_before']['kind'] ?? null) : null;
            $sourceIndex = is_array($contact) ? ($contact['source_index'] ?? null) : null;
            if (!is_string($kind) || '' === $kind || !is_int($sourceIndex)) {
                continue;
            }
            // A hit belongs to the latest move that started at or before it; only the move's first hit counts.
            $owner = null;
            foreach ($starts as $index => $start) {
                if ($start <= $sourceIndex) {
                    $owner = $index;
                }
            }
            if (null !== $owner && !isset($defenderStatusByIndex[$owner])) {
                $defenderStatusByIndex[$owner] = $kind;
            }
        }

        return ['install' => true === $install, 'defenderStatusByIndex' => $defenderStatusByIndex];
    }
}
