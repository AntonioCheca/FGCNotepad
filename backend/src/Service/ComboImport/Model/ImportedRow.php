<?php declare(strict_types=1);

namespace App\Service\ComboImport\Model;

final class ImportedRow
{
    /**
     * @param array<int, string> $cells
     */
    public function __construct(
        public readonly int $lineNumber,
        public readonly string $rawLine,
        public readonly array $cells,
    ) {
    }

    public function isEmpty(): bool
    {
        foreach ($this->cells as $cell) {
            if ('' !== trim($cell)) {
                return false;
            }
        }

        return true;
    }
}
