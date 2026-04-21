<?php declare(strict_types=1);

namespace App\Service\ComboImport\Parser;

use App\Service\ComboImport\Model\ImportParseResult;
use App\Service\ComboImport\Model\ImportedComboCandidate;
use App\Service\ComboImport\Model\ImportedRow;

final class NewChallengerImportParser implements ComboImportParserInterface
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
        $currentSection = null;

        foreach ($rows as $row) {
            if ($row->isEmpty()) {
                continue;
            }

            if (null === $headerMap && $this->looksLikeHeader($row)) {
                $headerMap = $this->buildHeaderMap($row->cells);
                continue;
            }

            if ($this->isSectionRow($row)) {
                $currentSection = trim($row->cells[0]);
                continue;
            }

            $candidate = $this->buildCandidate($row, $character, $sourceFile, $currentSection, $headerMap, $onlySection);
            if (null === $candidate) {
                $discarded++;
                continue;
            }

            $candidateLines++;
            $candidates[] = $candidate;
        }

        if (null === $headerMap) {
            $warnings[] = 'No header row detected. Falling back to positional parsing.';
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
        $normalizedCells = array_map([$this, 'normalizeHeaderToken'], $row->cells);
        $joined = implode(' ', $normalizedCells);

        return str_contains($joined, 'combo')
            && (str_contains($joined, 'damage') || str_contains($joined, 'drive') || str_contains($joined, 'notes'));
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
            $token = $this->normalizeHeaderToken($cell);
            if (str_contains($token, 'combo')) {
                $map['combo'] = $index;
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
            if (str_contains($token, 'note')) {
                $map['notes'] = $index;
            }
            if (str_contains($token, 'video')) {
                $map['video'] = $index;
            }
            if (str_contains($token, 'position')) {
                $map['position'] = $index;
            }
            if (str_contains($token, 'difficulty')) {
                $map['difficulty'] = $index;
            }
        }

        return $map;
    }

    private function isSectionRow(ImportedRow $row): bool
    {
        $meaningfulCells = array_values(array_filter($row->cells, static fn (string $cell): bool => '' !== trim($cell)));
        if (1 !== count($meaningfulCells)) {
            return false;
        }

        $value = trim($meaningfulCells[0]);
        if ('' === $value) {
            return false;
        }

        if (preg_match('/\d/', $value)) {
            return false;
        }

        if (str_contains($value, ',') || str_contains(strtolower($value), 'qcf+') || str_contains(strtolower($value), 'srk+')) {
            return false;
        }

        return true;
    }

    /**
     * @param array<string, int>|null $headerMap
     */
    private function buildCandidate(
        ImportedRow $row,
        string $character,
        string $sourceFile,
        ?string $currentSection,
        ?array $headerMap,
        ?string $onlySection,
    ): ?ImportedComboCandidate {
        $rowWarnings = [];

        if (null !== $onlySection && null !== $currentSection && 0 !== strcasecmp(trim($onlySection), trim($currentSection))) {
            return null;
        }

        $comboText = $this->extractValue($row->cells, $headerMap, 'combo', 0);
        if (null === $comboText || '' === trim($comboText)) {
            return null;
        }

        if (!$this->looksLikeComboText($comboText)) {
            return null;
        }

        $damageRaw = $this->extractValue($row->cells, $headerMap, 'damage', 1);
        $driveRaw = $this->extractValue($row->cells, $headerMap, 'drive', 2);
        $superRaw = $this->extractValue($row->cells, $headerMap, 'super', 3);
        $notesRaw = $this->extractValue($row->cells, $headerMap, 'notes', 4);

        if (null === $damageRaw) {
            $rowWarnings[] = 'Missing damage column value.';
        }

        return new ImportedComboCandidate(
            source: 'newchallenger',
            character: $character,
            sourceFile: $sourceFile,
            lineNumber: $row->lineNumber,
            section: $currentSection,
            comboTextRaw: trim($comboText),
            damageRaw: $this->normalizeNullableValue($damageRaw),
            driveRaw: $this->normalizeNullableValue($driveRaw),
            superRaw: $this->normalizeNullableValue($superRaw),
            positionRaw: null,
            difficultyRaw: null,
            notesRaw: $this->normalizeNullableValue($notesRaw),
            videoRaw: null,
            warnings: $rowWarnings,
            rawRowSnapshot: $row->cells,
        );
    }

    /**
     * @param array<int, string> $cells
     * @param array<string, int>|null $headerMap
     */
    private function extractValue(array $cells, ?array $headerMap, string $key, int $fallbackIndex): ?string
    {
        if (null !== $headerMap && isset($headerMap[$key])) {
            return $cells[$headerMap[$key]] ?? null;
        }

        return $cells[$fallbackIndex] ?? null;
    }

    private function looksLikeComboText(string $value): bool
    {
        $normalized = strtolower(trim($value));
        if ('' === $normalized) {
            return false;
        }

        return (bool) preg_match('/(st\.|cr\.|j\.|qcf\+|qcb\+|srk\+|\bdr\b|[2468]lp|[2468]mp|[2468]hp|\bdi\b|xx|,)/i', $normalized);
    }

    private function normalizeNullableValue(?string $value): ?string
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

    private function normalizeHeaderToken(string $value): string
    {
        $normalized = strtolower(trim($value));

        return preg_replace('/\s+/', ' ', $normalized) ?? $normalized;
    }
}
