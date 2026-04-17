<?php declare(strict_types=1);

namespace App\Service;

final class ComboNotationTranslator
{
    private const CONNECTOR_CANCEL = 'XX';
    private const CONNECTOR_TARGET_COMBO = 'TC';

    /**
     * @param array<int, array{id:int, notation:string, moveType:string|null}> $leafOptions
     * @param array<int, array{id:int, name:string}> $connectionTypes
     *
     * @return array{
     *   steps: array<int, array{child_sequence_id:int, ordinal_in_combo:int, connection_type_id:int|null, connection_type_name:string|null, token:string}>,
     *   parsedTokens: array<int, array{index:int, token:string, normalizedToken:string, status:string, child_sequence_id:int|null, reason:string|null}>,
     *   warnings: array<int, string>,
     *   errors: array<int, array{index:int, token:string, normalizedToken:string, code:string, message:string}>
     * }
     */
    public function translate(string $notation, array $leafOptions, array $connectionTypes): array
    {
        $warnings = [];
        $errors = [];
        $parsedTokens = [];

        $leafIndex = $this->buildLeafIndex($leafOptions, $warnings);
        $connectionIndex = $this->buildConnectionIndex($connectionTypes);

        $tokens = $this->tokenizeNotation($notation);

        $resolvedMoves = [];
        $pendingConnector = null;

        foreach ($tokens as $index => $token) {
            $normalizedToken = $this->normalizeNotationToken($token);
            $connector = $this->normalizeConnector($normalizedToken);

            if (null !== $connector) {
                if ([] === $resolvedMoves) {
                    $warnings[] = sprintf('Connector "%s" at token %d was ignored because it appears before any move.', $token, $index + 1);
                    continue;
                }

                $pendingConnector = $connector;
                continue;
            }

            $leaf = $leafIndex[$normalizedToken] ?? null;
            if (null === $leaf) {
                $errors[] = [
                    'index' => $index + 1,
                    'token' => $token,
                    'normalizedToken' => $normalizedToken,
                    'code' => 'unknown_move',
                    'message' => sprintf('Token "%s" does not match any known move for this character.', $token),
                ];

                $parsedTokens[] = [
                    'index' => $index + 1,
                    'token' => $token,
                    'normalizedToken' => $normalizedToken,
                    'status' => 'invalid',
                    'child_sequence_id' => null,
                    'reason' => 'unknown_move',
                ];

                $pendingConnector = null;
                continue;
            }

            $resolvedMoves[] = [
                'token' => $token,
                'normalizedToken' => $normalizedToken,
                'leafId' => $leaf['id'],
                'moveType' => $leaf['moveType'],
                'connector' => $pendingConnector,
            ];

            $parsedTokens[] = [
                'index' => $index + 1,
                'token' => $token,
                'normalizedToken' => $normalizedToken,
                'status' => 'parsed',
                'child_sequence_id' => $leaf['id'],
                'reason' => null,
            ];

            $pendingConnector = null;
        }

        if (null !== $pendingConnector) {
            $warnings[] = sprintf('Connector "%s" at the end of notation was ignored.', $pendingConnector);
        }

        $steps = [];
        foreach ($resolvedMoves as $index => $move) {
            $canonicalConnection = 'initial_move';
            if ($index > 0) {
                $previousMove = $resolvedMoves[$index - 1];
                $canonicalConnection = $this->inferConnection(
                    $move['connector'],
                    $previousMove['moveType'],
                    $move['moveType']
                );
            }

            $resolvedConnection = $this->resolveConnectionType($canonicalConnection, $connectionIndex);
            if (null === $resolvedConnection) {
                $warnings[] = sprintf('Connection type "%s" is not configured in backend data.', $canonicalConnection);
            }

            $steps[] = [
                'child_sequence_id' => $move['leafId'],
                'ordinal_in_combo' => $index + 1,
                'connection_type_id' => $resolvedConnection['id'] ?? null,
                'connection_type_name' => $resolvedConnection['name'] ?? null,
                'token' => $move['token'],
            ];
        }

        return [
            'steps' => $steps,
            'parsedTokens' => $parsedTokens,
            'warnings' => $warnings,
            'errors' => $errors,
        ];
    }

    /**
     * @param array<int, array{id:int, notation:string, moveType:string|null}> $leafOptions
     * @param array<int, array{id:int, name:string}> $connectionTypes
     *
     * @return array{
     *   steps: array<int, array{child_sequence_id:int, ordinal_in_combo:int, connection_type_id:int|null, connection_type_name:string|null, token:string}>,
     *   parsedTokens: array<int, array{index:int, token:string, normalizedToken:string, status:string, child_sequence_id:int|null, reason:string|null}>,
     *   warnings: array<int, string>,
     *   errors: array<int, array{index:int, token:string, normalizedToken:string, code:string, message:string}>
     * }
     */
    public function translateNotationToInternalSteps(string $notation, array $leafOptions, array $connectionTypes): array
    {
        return $this->translate($notation, $leafOptions, $connectionTypes);
    }

    /**
     * Base method for the reverse direction (internal steps -> numpad notation).
     *
     * @param array<int, array{child_sequence_id:int, connection_type_name:string|null}> $steps
     * @param array<int, string> $notationByLeafId
     *
     * @return array{notation:string, tokens:array<int, string>, warnings:array<int, string>}
     */
    public function translateInternalStepsToNotation(array $steps, array $notationByLeafId): array
    {
        $warnings = [];
        $tokens = [];

        foreach ($steps as $index => $step) {
            $leafId = $step['child_sequence_id'];
            $notation = $notationByLeafId[$leafId] ?? null;
            if (null === $notation) {
                $warnings[] = sprintf('Step %d references unknown leaf sequence ID %d.', $index + 1, $leafId);
                continue;
            }

            if ($index > 0) {
                $connector = $this->mapConnectionNameToConnector($step['connection_type_name'] ?? null);
                if (null !== $connector) {
                    $tokens[] = $connector;
                }
            }

            $tokens[] = $notation;
        }

        return [
            'notation' => implode(', ', $tokens),
            'tokens' => $tokens,
            'warnings' => $warnings,
        ];
    }

    /**
     * @param array<int, array{id:int, notation:string, moveType:string|null}> $leafOptions
     * @param array<int, string> $warnings
     *
     * @return array<string, array{id:int, moveType:string|null}>
     */
    private function buildLeafIndex(array $leafOptions, array &$warnings): array
    {
        $index = [];

        foreach ($leafOptions as $leaf) {
            $normalizedNotation = $this->normalizeNotationToken($leaf['notation']);
            if ('' === $normalizedNotation) {
                continue;
            }

            if (isset($index[$normalizedNotation])) {
                $warnings[] = sprintf('Duplicate move notation "%s" detected. First match is used.', $leaf['notation']);
                continue;
            }

            $index[$normalizedNotation] = [
                'id' => $leaf['id'],
                'moveType' => $leaf['moveType'],
            ];
        }

        return $index;
    }

    /**
     * @param array<int, array{id:int, name:string}> $connectionTypes
     *
     * @return array<string, array{id:int, name:string}>
     */
    private function buildConnectionIndex(array $connectionTypes): array
    {
        $index = [];
        foreach ($connectionTypes as $connectionType) {
            $normalizedName = $this->normalizeConnectionName($connectionType['name']);
            $index[$normalizedName] = $connectionType;
        }

        return $index;
    }

    /**
     * @return array<int, string>
     */
    private function tokenizeNotation(string $notation): array
    {
        $prepared = preg_replace('/(XX|TC)/i', ' $1 ', $notation) ?? $notation;
        $tokens = preg_split('/[\s,]+/', trim($prepared));

        if (false === $tokens || null === $tokens) {
            return [];
        }

        return array_values(array_filter($tokens, static fn (string $token): bool => '' !== trim($token)));
    }

    private function normalizeNotationToken(string $token): string
    {
        $normalized = strtoupper(trim($token));

        return preg_replace('/\s+/', '', $normalized) ?? $normalized;
    }

    private function normalizeConnector(string $token): ?string
    {
        return match ($token) {
            self::CONNECTOR_CANCEL => 'cancel',
            self::CONNECTOR_TARGET_COMBO => 'target_combo',
            default => null,
        };
    }

    private function inferConnection(?string $explicitConnector, ?string $previousMoveType, ?string $currentMoveType): string
    {
        if ('target_combo' === $explicitConnector) {
            return 'target_combo';
        }

        if ('cancel' === $explicitConnector) {
            return $this->isSuperMoveType($currentMoveType) ? 'super_cancel' : 'special_cancel';
        }

        $candidateConnections = [];

        if ($this->isChainCandidate($previousMoveType, $currentMoveType)) {
            $candidateConnections[] = 'chain';
        }

        if ($this->isSpecialCancelCandidate($currentMoveType)) {
            $candidateConnections[] = 'special_cancel';
        }

        if ($this->isSuperMoveType($currentMoveType)) {
            $candidateConnections[] = 'super_cancel';
        }

        if ([] === $candidateConnections) {
            return 'link';
        }

        foreach (['chain', 'special_cancel', 'super_cancel', 'target_combo', 'link'] as $priority) {
            if (in_array($priority, $candidateConnections, true)) {
                return $priority;
            }
        }

        return 'link';
    }

    private function isChainCandidate(?string $previousMoveType, ?string $currentMoveType): bool
    {
        return $this->isNormalLike($previousMoveType) && $this->isNormalLike($currentMoveType);
    }

    private function isSpecialCancelCandidate(?string $currentMoveType): bool
    {
        if (null === $currentMoveType) {
            return false;
        }

        $normalized = strtolower($currentMoveType);

        return in_array($normalized, ['special', 'movement-special', 'drive'], true);
    }

    private function isSuperMoveType(?string $moveType): bool
    {
        return null !== $moveType && 'super' === strtolower($moveType);
    }

    private function isNormalLike(?string $moveType): bool
    {
        if (null === $moveType) {
            return false;
        }

        return in_array(strtolower($moveType), ['normal', 'follow-up', 'throw'], true);
    }

    /**
     * @param array<string, array{id:int, name:string}> $connectionIndex
     *
     * @return array{id:int, name:string}|null
     */
    private function resolveConnectionType(string $canonicalConnection, array $connectionIndex): ?array
    {
        $aliases = [
            'initial_move' => ['initialmove', 'initial'],
            'chain' => ['chain'],
            'special_cancel' => ['specialcancel', 'special', 'cancel'],
            'super_cancel' => ['supercancel', 'super'],
            'target_combo' => ['targetcombo', 'tc'],
            'link' => ['link'],
        ];

        $canonicalAliases = $aliases[$canonicalConnection] ?? [];
        foreach ($canonicalAliases as $alias) {
            if (isset($connectionIndex[$alias])) {
                return $connectionIndex[$alias];
            }
        }

        if ('super_cancel' === $canonicalConnection) {
            foreach (['specialcancel', 'special'] as $fallbackAlias) {
                if (isset($connectionIndex[$fallbackAlias])) {
                    return $connectionIndex[$fallbackAlias];
                }
            }
        }

        return null;
    }

    private function normalizeConnectionName(string $name): string
    {
        $normalized = strtolower(trim($name));

        return preg_replace('/[^a-z0-9]/', '', $normalized) ?? $normalized;
    }

    private function mapConnectionNameToConnector(?string $connectionTypeName): ?string
    {
        if (null === $connectionTypeName) {
            return null;
        }

        $normalized = $this->normalizeConnectionName($connectionTypeName);

        if ('targetcombo' === $normalized || 'tc' === $normalized) {
            return self::CONNECTOR_TARGET_COMBO;
        }

        if (in_array($normalized, ['special', 'specialcancel', 'supercancel', 'super', 'cancel'], true)) {
            return self::CONNECTOR_CANCEL;
        }

        return null;
    }
}
