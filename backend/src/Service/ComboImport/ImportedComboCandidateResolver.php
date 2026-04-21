<?php declare(strict_types=1);

namespace App\Service\ComboImport;

use App\Service\ComboImport\Model\ImportedComboCandidate;
use App\Service\ComboImport\Model\ResolvedImportedComboCandidate;
use App\Service\ComboNotationTranslator;

class ImportedComboCandidateResolver
{
    public function __construct(
        private ComboNotationTranslator $comboNotationTranslator,
        private SfNotationTranslator $sfNotationTranslator,
    ) {
    }

    /**
     * @param array<int, ImportedComboCandidate> $candidates
     * @param array<int, array{id:int, notation:string, moveType:string|null}> $leafOptions
     * @param array<int, array{id:int, name:string}> $connectionTypes
     *
     * @return array<int, ResolvedImportedComboCandidate>
     */
    public function resolve(array $candidates, array $leafOptions, array $connectionTypes): array
    {
        $resolved = [];

        foreach ($candidates as $candidate) {
            $normalizedNotation = $candidate->comboTextRaw;
            $warnings = $candidate->warnings;
            $hasPreTranslationUnknownTokens = false;

            if ('newchallenger' === $candidate->source) {
                $sfResult = $this->sfNotationTranslator->translate($candidate->comboTextRaw);
                $normalizedNotation = $sfResult['normalizedNotation'];
                $warnings = [...$warnings, ...$sfResult['warnings']];
                $hasPreTranslationUnknownTokens = [] !== $sfResult['unknownTokens'];
            }

            if ('supercombo' === $candidate->source) {
                $normalizedNotation = $this->normalizeSupercomboNotation($candidate->comboTextRaw, $warnings);
            }

            $translated = $this->comboNotationTranslator->translateNotationToInternalSteps(
                $normalizedNotation,
                $leafOptions,
                $connectionTypes,
            );

            $warnings = [...$warnings, ...$translated['warnings']];
            $errors = $translated['errors'];

            $status = 'discarded';
            if ([] !== $translated['steps'] && [] === $errors && false === $hasPreTranslationUnknownTokens) {
                $status = 'valid';
            } elseif ([] !== $translated['steps'] || [] !== $errors) {
                $status = 'partial';
            } elseif ($hasPreTranslationUnknownTokens) {
                $status = 'partial';
            }

            $resolved[] = new ResolvedImportedComboCandidate(
                candidate: $candidate,
                normalizedNotation: '' === trim($normalizedNotation) ? null : $normalizedNotation,
                steps: $translated['steps'],
                warnings: $warnings,
                errors: $errors,
                status: $status,
            );
        }

        return $resolved;
    }

    /**
     * @param array<int, string> $warnings
     */
    private function normalizeSupercomboNotation(string $comboRaw, array &$warnings): string
    {
        $prepared = trim($comboRaw);
        $prepared = preg_replace('/\bPC\s+DI\b/i', 'DI', $prepared) ?? $prepared;
        $prepared = preg_replace('/\bDI\s*\(blocked\)\s*/i', 'DI, ', $prepared) ?? $prepared;
        $prepared = preg_replace('/\bDI\b\s*/i', 'DI, ', $prepared) ?? $prepared;
        $prepared = str_replace(['>', '~'], ',', $prepared);
        $prepared = preg_replace('/\s+/', ' ', $prepared) ?? $prepared;

        if (str_contains($prepared, 'DI')) {
            $warnings[] = 'DI context detected in combo text.';
        }

        return $prepared;
    }
}
