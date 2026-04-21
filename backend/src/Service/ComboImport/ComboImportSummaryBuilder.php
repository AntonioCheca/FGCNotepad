<?php declare(strict_types=1);

namespace App\Service\ComboImport;

use App\Service\ComboImport\Model\ImportExecutionReport;
use App\Service\ComboImport\Model\ImportParseResult;
use App\Service\ComboImport\Model\ImportedComboPreview;
use App\Service\ComboImport\Model\ResolvedImportedComboCandidate;

class ComboImportSummaryBuilder
{
    /**
     * @param array<int, ResolvedImportedComboCandidate> $resolved
     * @param array<int, string> $globalWarnings
     */
    public function build(
        ImportParseResult $parseResult,
        array $resolved,
        int $persistedCombos,
        array $globalWarnings = [],
        ?int $limit = null,
    ): ImportExecutionReport {
        $valid = 0;
        $partial = 0;
        $discardedFromResolution = 0;
        $previews = [];

        $resolvedSubset = $resolved;
        if (null !== $limit && $limit > 0) {
            $resolvedSubset = array_slice($resolvedSubset, 0, $limit);
        }

        foreach ($resolved as $item) {
            if ('valid' === $item->status) {
                $valid++;
            } elseif ('partial' === $item->status) {
                $partial++;
            } else {
                $discardedFromResolution++;
            }
        }

        foreach ($resolvedSubset as $item) {
            $previews[] = new ImportedComboPreview(
                lineNumber: $item->candidate->lineNumber,
                section: $item->candidate->section,
                comboRaw: $item->candidate->comboTextRaw,
                notationNormalized: $item->normalizedNotation,
                damage: $this->toNullableInt($item->candidate->damageRaw),
                drive: $this->toNullableInt($item->candidate->driveRaw),
                super: $this->toNullableInt($item->candidate->superRaw),
                position: $item->candidate->positionRaw,
                difficulty: $item->candidate->difficultyRaw,
                notes: $this->truncate($item->candidate->notesRaw),
                warnings: [...$item->warnings, ...$this->formatErrorsAsWarnings($item)],
                status: $item->status,
            );
        }

        return new ImportExecutionReport(
            totalLines: $parseResult->totalLines,
            candidateLines: $parseResult->candidateLineCount,
            validCombos: $valid,
            partialCombos: $partial,
            discardedLines: $parseResult->discardedLineCount + $discardedFromResolution,
            persistedCombos: $persistedCombos,
            previews: $previews,
            warnings: [...$parseResult->warnings, ...$globalWarnings],
        );
    }

    private function toNullableInt(?string $value): ?int
    {
        if (null === $value) {
            return null;
        }

        if (!preg_match('/^-?\d+$/', trim($value))) {
            return null;
        }

        return (int) $value;
    }

    private function truncate(?string $value, int $max = 90): ?string
    {
        if (null === $value) {
            return null;
        }

        if (mb_strlen($value) <= $max) {
            return $value;
        }

        return mb_substr($value, 0, $max - 3) . '...';
    }

    /**
     * @return array<int, string>
     */
    private function formatErrorsAsWarnings(ResolvedImportedComboCandidate $item): array
    {
        $warnings = [];
        foreach ($item->errors as $error) {
            $warnings[] = sprintf('Token %d "%s": %s', $error['index'], $error['token'], $error['message']);
        }

        return $warnings;
    }
}
