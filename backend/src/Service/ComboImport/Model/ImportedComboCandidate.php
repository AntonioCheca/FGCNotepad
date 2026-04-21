<?php declare(strict_types=1);

namespace App\Service\ComboImport\Model;

final class ImportedComboCandidate
{
    /**
     * @param array<int, string> $warnings
     * @param array<int, string> $rawRowSnapshot
     */
    public function __construct(
        public readonly string $source,
        public readonly string $character,
        public readonly string $sourceFile,
        public readonly int $lineNumber,
        public readonly ?string $section,
        public readonly string $comboTextRaw,
        public readonly ?string $damageRaw,
        public readonly ?string $driveRaw,
        public readonly ?string $superRaw,
        public readonly ?string $positionRaw,
        public readonly ?string $difficultyRaw,
        public readonly ?string $notesRaw,
        public readonly ?string $videoRaw,
        public readonly array $warnings,
        public readonly array $rawRowSnapshot,
    ) {
    }
}
