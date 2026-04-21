<?php declare(strict_types=1);

namespace App\Service\ComboImport;

use App\Service\ComboImport\Model\ImportedRow;

class DelimitedImportFileReader
{
    /**
     * @return array<int, ImportedRow>
     */
    public function readTsv(string $filePath): array
    {
        if (!is_file($filePath)) {
            throw new \RuntimeException(sprintf('Import file not found: %s', $filePath));
        }

        $contents = file_get_contents($filePath);
        if (false === $contents) {
            throw new \RuntimeException(sprintf('Unable to read import file: %s', $filePath));
        }

        $lines = preg_split('/\r\n|\n|\r/', $contents);
        if (false === $lines || null === $lines) {
            return [];
        }

        $rows = [];
        foreach ($lines as $index => $line) {
            $cells = array_map(
                static fn (string $cell): string => trim($cell),
                explode("\t", (string) $line)
            );

            $rows[] = new ImportedRow($index + 1, (string) $line, $cells);
        }

        return $rows;
    }
}
