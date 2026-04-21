<?php declare(strict_types=1);

namespace App\Service\ComboImport\Model;

final class ImportParseResult
{
    /**
     * @param array<int, ImportedComboCandidate> $candidates
     * @param array<int, string> $warnings
     */
    public function __construct(
        public readonly int $totalLines,
        public readonly int $candidateLineCount,
        public readonly int $discardedLineCount,
        public readonly array $candidates,
        public readonly array $warnings,
    ) {
    }
}
