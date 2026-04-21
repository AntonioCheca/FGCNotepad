<?php declare(strict_types=1);

namespace App\Service\ComboImport\Model;

final class ImportExecutionReport
{
    /**
     * @param array<int, ImportedComboPreview> $previews
     * @param array<int, string> $warnings
     */
    public function __construct(
        public readonly int $totalLines,
        public readonly int $candidateLines,
        public readonly int $validCombos,
        public readonly int $partialCombos,
        public readonly int $discardedLines,
        public readonly int $persistedCombos,
        public readonly array $previews,
        public readonly array $warnings,
    ) {
    }
}
