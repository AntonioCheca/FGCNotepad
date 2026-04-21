<?php declare(strict_types=1);

namespace App\Service\ComboImport\Parser;

use App\Service\ComboImport\Model\ImportParseResult;
use App\Service\ComboImport\Model\ImportedComboCandidate;
use App\Service\ComboImport\Model\ImportedRow;

final class SupercomboImportParser implements ComboImportParserInterface
{
    /**
     * @param array<int, ImportedRow> $rows
     */
    public function parse(array $rows, string $character, string $sourceFile, ?string $onlySection = null): ImportParseResult
    {
        $candidates = [];
        $warnings = [];
        $discarded = 0;
        $candidateLines = 0;

        $headerMap = null;

        foreach ($rows as $row) {
            if ($row->isEmpty()) {
                continue;
            }

            if (null === $headerMap && $this->looksLikeHeader($row)) {
                $headerMap = $this->buildHeaderMap($row->cells);
                continue;
            }

            if (null === $headerMap) {
                $discarded++;
                continue;
            }

            $comboText = $this->extractValue($row->cells, $headerMap, 'combo');
            if (null === $comboText || '' === trim($comboText)) {
                $discarded++;
                continue;
            }

            if (!$this->looksLikeCombo($comboText)) {
                $discarded++;
                continue;
            }

            $candidateLines++;

            $candidates[] = new ImportedComboCandidate(
                source: 'supercombo',
                character: $character,
                sourceFile: $sourceFile,
                lineNumber: $row->lineNumber,
                section: $onlySection,
                comboTextRaw: trim($comboText),
                damageRaw: $this->normalizeNullable($this->extractValue($row->cells, $headerMap, 'damage')),
                driveRaw: $this->normalizeNullable($this->extractValue($row->cells, $headerMap, 'drive')),
                superRaw: $this->normalizeNullable($this->extractValue($row->cells, $headerMap, 'super')),
                positionRaw: $this->normalizeNullable($this->extractValue($row->cells, $headerMap, 'position')),
                difficultyRaw: $this->normalizeNullable($this->extractValue($row->cells, $headerMap, 'difficulty')),
                notesRaw: $this->normalizeNullable($this->extractValue($row->cells, $headerMap, 'notes')),
                videoRaw: $this->normalizeNullable($this->extractValue($row->cells, $headerMap, 'video')),
                warnings: [],
                rawRowSnapshot: $row->cells,
            );
        }

        if (null === $headerMap) {
            $warnings[] = 'No Supercombo header row detected.';
        }

        return new ImportParseResult(
            totalLines: count($rows),
            candidateLineCount: $candidateLines,
            discardedLineCount: $discarded,
            candidates: $candidates,
            warnings: $warnings,
        );
    }

    private function looksLikeHeader(ImportedRow $row): bool
    {
        $joined = strtolower(implode(' ', $row->cells));

        return str_contains($joined, 'combo')
            && str_contains($joined, 'damage')
            && str_contains($joined, 'position');
    }

    /**
     * @param array<int, string> $cells
     *
     * @return array<string, int>
     */
    private function buildHeaderMap(array $cells): array
    {
        $map = [];
        foreach ($cells as $index => $cell) {
            $token = strtolower(trim($cell));
            $token = preg_replace('/\s+/', ' ', $token) ?? $token;

            if (str_contains($token, 'combo')) {
                $map['combo'] = $index;
            }
            if (str_contains($token, 'position')) {
                $map['position'] = $index;
            }
            if (str_contains($token, 'damage')) {
                $map['damage'] = $index;
            }
            if (str_contains($token, 'drive')) {
                $map['drive'] = $index;
            }
            if (str_contains($token, 'super')) {
                $map['super'] = $index;
            }
            if (str_contains($token, 'difficulty')) {
                $map['difficulty'] = $index;
            }
            if (str_contains($token, 'note')) {
                $map['notes'] = $index;
            }
            if (str_contains($token, 'video')) {
                $map['video'] = $index;
            }
        }

        return $map;
    }

    /**
     * @param array<int, string> $cells
     * @param array<string, int> $headerMap
     */
    private function extractValue(array $cells, array $headerMap, string $key): ?string
    {
        if (!isset($headerMap[$key])) {
            return null;
        }

        return $cells[$headerMap[$key]] ?? null;
    }

    private function looksLikeCombo(string $value): bool
    {
        return (bool) preg_match('/\d(\d)?[A-Z]{1,2}|[\>~,]|\bDI\b|\bPC\b/i', $value);
    }

    private function normalizeNullable(?string $value): ?string
    {
        if (null === $value) {
            return null;
        }

        $trimmed = trim($value);
        if ('' === $trimmed || '-' === $trimmed) {
            return null;
        }

        return $trimmed;
    }
}
