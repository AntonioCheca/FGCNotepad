<?php declare(strict_types=1);

namespace App\Service;

/** Accumulates skipped observations and warnings across one neutral stats bundle import. */
final class NeutralImportReport
{
    public int $observationCount = 0;
    public int $importedCount = 0;

    /** @var array<string, array{character: string, notation: string, actionId: int|null, moveName: string|null, count: int}> */
    private array $unmapped = [];

    /** @var array<string, int> */
    private array $warnings = [];

    public function addUnmapped(string $character, string $notation, ?int $actionId, ?string $moveName): void
    {
        $key = sprintf('%s|%s|%s', $character, $notation, $actionId ?? '');
        $this->unmapped[$key] ??= ['character' => $character, 'notation' => $notation, 'actionId' => $actionId, 'moveName' => $moveName, 'count' => 0];
        ++$this->unmapped[$key]['count'];
    }

    public function addWarning(string $warning): void
    {
        $this->warnings[$warning] = ($this->warnings[$warning] ?? 0) + 1;
    }

    public function skippedCount(): int
    {
        return $this->observationCount - $this->importedCount;
    }

    /** @return list<array{character: string, notation: string, actionId: int|null, moveName: string|null, count: int}> */
    public function unmappedMoves(): array
    {
        $moves = array_values($this->unmapped);
        usort($moves, static fn (array $left, array $right): int => [$right['count'], $left['character'], $left['notation']] <=> [$left['count'], $right['character'], $right['notation']]);

        return $moves;
    }

    /** @return list<string> */
    public function warnings(): array
    {
        $warnings = [];
        foreach ($this->warnings as $warning => $count) {
            $warnings[] = $count > 1 ? sprintf('%s (x%d)', $warning, $count) : $warning;
        }

        return $warnings;
    }
}
