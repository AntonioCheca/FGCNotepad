<?php declare(strict_types=1);

namespace App\Service;

final class FrameDataScalingNormalizerService
{
    public function normalize(?string $rawScaling): FrameDataScalingNormalizationResult
    {
        if (null === $rawScaling || '' === trim($rawScaling)) {
            return new FrameDataScalingNormalizationResult(
                startPercent: null,
                immediatePercent: null,
                minimumPercent: null,
                comboHits: null,
                comboExtraPercent: null,
                multiplierPercent: null,
                parseStatus: 'unparsed',
                parseNote: null,
                warnings: [],
            );
        }

        $normalized = $this->normalizeRawString($rawScaling);
        $parts = $this->splitParts($normalized);

        $startPercent = null;
        $immediatePercent = null;
        $minimumPercent = null;
        $comboHits = null;
        $comboExtraPercent = null;
        $multiplierPercent = null;
        $unknownParts = [];

        foreach ($parts as $part) {
            if (preg_match('/^(\d{1,3})%\s+start(?:\s*\(([^)]*)\))?$/i', $part, $matches)) {
                $startPercent = (int) $matches[1];
                if (isset($matches[2]) && '' !== trim($matches[2])) {
                    $unknownParts[] = $part;
                }
                continue;
            }

            if (preg_match('/^(\d{1,3})%\s+immediate(?:\s*\(([^)]*)\))?$/i', $part, $matches)) {
                $immediatePercent = (int) $matches[1];
                if (isset($matches[2]) && '' !== trim($matches[2])) {
                    $unknownParts[] = $part;
                }
                continue;
            }

            if (preg_match('/^(\d{1,3})%\s+minimum(?:\s*\(([^)]*)\))?$/i', $part, $matches)) {
                $minimumPercent = (int) $matches[1];
                if (isset($matches[2]) && '' !== trim($matches[2])) {
                    $unknownParts[] = $part;
                }
                continue;
            }

            if ($this->tryParseComboPart($part, $comboHits, $comboExtraPercent)) {
                continue;
            }

            if (preg_match('/^combo\s*\(\s*(\d{1,3})%\s*extra\s*\)$/i', $part, $matches)) {
                $comboExtraPercent = (int) $matches[1];
                continue;
            }

            if (preg_match('/^(\d{1,3})%\s+combo(?:\s*\([^)]*\))?$/i', $part, $matches)) {
                $comboExtraPercent = (int) $matches[1];
                continue;
            }

            if (preg_match('/^(\d{1,3})%\s+multiplier(?:\s*\([^)]*\))?$/i', $part, $matches)) {
                $multiplierPercent = (int) $matches[1];
                continue;
            }

            if (preg_match('/^(\d+)\s+hits(?:\s*\([^)]*\))?$/i', $part, $matches)) {
                $comboHits = (int) $matches[1];
                continue;
            }

            if ($this->isVariantPart($part)) {
                $unknownParts[] = $part;
                continue;
            }

            if (preg_match('/^\d+%\(\d+%\)\s+start/i', $part)) {
                $unknownParts[] = $part;
                continue;
            }

            $unknownParts[] = $part;
        }

        $hasRecognizedValue = null !== $startPercent
            || null !== $immediatePercent
            || null !== $minimumPercent
            || null !== $comboHits
            || null !== $comboExtraPercent
            || null !== $multiplierPercent;

        $warnings = [];
        $parseStatus = 'parsed';
        $parseNote = null;

        if ([] !== $unknownParts) {
            $parseNote = implode(' | ', array_values(array_unique($unknownParts)));
            $warnings[] = sprintf('Unsupported scaling fragment(s): %s', $parseNote);
            $parseStatus = $hasRecognizedValue ? 'partial' : 'unparsed';
        } elseif (!$hasRecognizedValue) {
            $parseStatus = 'unparsed';
        }

        return new FrameDataScalingNormalizationResult(
            startPercent: $startPercent,
            immediatePercent: $immediatePercent,
            minimumPercent: $minimumPercent,
            comboHits: $comboHits,
            comboExtraPercent: $comboExtraPercent,
            multiplierPercent: $multiplierPercent,
            parseStatus: $parseStatus,
            parseNote: $parseNote,
            warnings: $warnings,
        );
    }

    private function normalizeRawString(string $raw): string
    {
        $normalized = str_replace(["\r\n", "\r"], "\n", trim($raw));
        $normalized = preg_replace('/\s*\n\s*/', ' / ', $normalized) ?? $normalized;
        $normalized = preg_replace('/\s*\/\s*/', ' / ', $normalized) ?? $normalized;
        $normalized = preg_replace('/\s+/', ' ', $normalized) ?? $normalized;

        return trim($normalized);
    }

    /**
     * @return list<string>
     */
    private function splitParts(string $normalized): array
    {
        $rawParts = preg_split('/\s*\/\s*/', $normalized);
        if (false === $rawParts) {
            return [];
        }

        $parts = array_map(
            static fn (string $part): string => trim($part),
            $rawParts
        );

        $parts = array_values(array_filter($parts, static fn (string $part): bool => '' !== $part));

        return $parts;
    }

    private function isVariantPart(string $part): bool
    {
        return preg_match('/^[a-z0-9+\/-]+\s*:/i', $part) === 1;
    }

    private function tryParseComboPart(string $part, ?int &$comboHits, ?int &$comboExtraPercent): bool
    {
        if (!preg_match('/^combo\s*\(([^)]*)\)$/i', $part, $matches)) {
            return false;
        }

        $inside = mb_strtolower(trim($matches[1]));
        if (preg_match('/(\d+)\s*hits?/', $inside, $hitsMatch)) {
            $comboHits = (int) $hitsMatch[1];
        }

        if (preg_match('/(\d{1,3})%\s*extra/', $inside, $extraMatch)) {
            $comboExtraPercent = (int) $extraMatch[1];
        }

        return true;
    }
}
