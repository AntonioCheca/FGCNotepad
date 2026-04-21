<?php declare(strict_types=1);

namespace App\Service\ComboImport\Model;

final class ImportedComboPreview
{
    /**
     * @param array<int, string> $warnings
     */
    public function __construct(
        public readonly int $lineNumber,
        public readonly ?string $section,
        public readonly string $comboRaw,
        public readonly ?string $notationNormalized,
        public readonly ?int $damage,
        public readonly ?int $drive,
        public readonly ?int $super,
        public readonly ?string $position,
        public readonly ?string $difficulty,
        public readonly ?string $notes,
        public readonly array $warnings,
        public readonly string $status,
    ) {
    }
}
