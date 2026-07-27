<?php declare(strict_types=1);

namespace App\Service;

final class ComboNotationTranslator
{
    private const CONNECTOR_CANCEL = 'XX';
    private const CONNECTOR_TARGET_COMBO = 'TC';
    private const CONNECTOR_ARROW = '>';

    /**
     * @param array<int, array{id:int, notation:string, moveType:string|null, cancelTypeCodes?:array<int, string>, aliases?:array<int, string>}> $leafOptions
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
        $leafAliases = $this->buildLeafAliases($leafOptions, $warnings);
        $leafAliasIndex = $this->buildLeafAliasIndex($leafAliases);
        $connectionIndex = $this->buildConnectionIndex($connectionTypes);

        $tokens = $this->tokenizeNotation($notation);

        $resolvedMoves = [];
        $pendingConnector = null;

        $cursor = 0;
        while ($cursor < count($tokens)) {
            $token = $tokens[$cursor];
            $normalizedToken = $this->normalizeNotationToken($token);
            $connector = $this->normalizeConnector($normalizedToken);

            if (null === $connector) {
                $composite = $this->resolveContextualTargetComboComposite(
                    $resolvedMoves,
                    $normalizedToken,
                    $pendingConnector,
                    $leafAliasIndex
                );
                if (null !== $composite) {
                    $previousIndex = count($resolvedMoves) - 1;
                    $parsedTokenIndex = $resolvedMoves[$previousIndex]['parsedTokenIndex'];
                    $resolvedMoves[$previousIndex] = $composite['move'];
                    $parsedTokens[$parsedTokenIndex] = [
                        'index' => $parsedTokens[$parsedTokenIndex]['index'],
                        'token' => $composite['token'],
                        'normalizedToken' => $composite['normalizedToken'],
                        'status' => 'parsed',
                        'child_sequence_id' => $composite['move']['leafId'],
                        'reason' => null,
                    ];

                    $pendingConnector = null;
                    ++$cursor;
                    continue;
                }
            }

            $driveRushResolution = $this->resolveDriveRushToken($normalizedToken, $resolvedMoves, $pendingConnector, $leafIndex, $token, $warnings);
            if ('connector' === $driveRushResolution['kind']) {
                $pendingConnector = 'drive_rush_cancel';
                ++$cursor;
                continue;
            }

            if ('move' === $driveRushResolution['kind']) {
                $leaf = $driveRushResolution['leaf'];
                $resolvedMoves[] = [
                    'token' => $token,
                    'normalizedToken' => $normalizedToken,
                    'leafId' => $leaf['id'],
                    'moveType' => $leaf['moveType'],
                    'connector' => null,
                    'cancelTypeCodes' => $leaf['cancelTypeCodes'],
                    'notation' => $leaf['notation'],
                    'parsedTokenIndex' => count($parsedTokens),
                ];

                $parsedTokens[] = [
                    'index' => $cursor + 1,
                    'token' => $token,
                    'normalizedToken' => $normalizedToken,
                    'status' => 'parsed',
                    'child_sequence_id' => $leaf['id'],
                    'reason' => null,
                ];

                $pendingConnector = null;
                ++$cursor;
                continue;
            }

            $segment = $this->matchLongestAliasAtCursor($tokens, $cursor, $leafAliases);
            if (null !== $segment) {
                $resolvedMoves[] = [
                    'token' => $segment['rawToken'],
                    'normalizedToken' => $segment['normalizedToken'],
                    'leafId' => $segment['leaf']['id'],
                    'moveType' => $segment['leaf']['moveType'],
                    'connector' => $pendingConnector,
                    'cancelTypeCodes' => $segment['leaf']['cancelTypeCodes'],
                    'notation' => $segment['leaf']['notation'],
                    'parsedTokenIndex' => count($parsedTokens),
                ];

                $parsedTokens[] = [
                    'index' => $cursor + 1,
                    'token' => $segment['rawToken'],
                    'normalizedToken' => $segment['normalizedToken'],
                    'status' => 'parsed',
                    'child_sequence_id' => $segment['leaf']['id'],
                    'reason' => null,
                ];

                $pendingConnector = null;
                $cursor += $segment['tokenCount'];
                continue;
            }

            if (null !== $connector) {
                if ([] === $resolvedMoves) {
                    $warnings[] = sprintf('Connector "%s" at token %d was ignored because it appears before any move.', $token, $cursor + 1);
                    ++$cursor;
                    continue;
                }

                if ('cancel' === $connector && ('drive_rush_cancel' === $pendingConnector || $this->isRawDriveRushMove($resolvedMoves[count($resolvedMoves) - 1]['normalizedToken']))) {
                    ++$cursor;
                    continue;
                }

                $pendingConnector = $connector;
                ++$cursor;
                continue;
            }

            $leaf = $this->findLeafByNormalizedToken($normalizedToken, $leafIndex);
            if (null === $leaf) {
                $errors[] = [
                    'index' => $cursor + 1,
                    'token' => $token,
                    'normalizedToken' => $normalizedToken,
                    'code' => 'unknown_move',
                    'message' => sprintf('Token "%s" does not match any known move for this character.', $token),
                ];

                $parsedTokens[] = [
                    'index' => $cursor + 1,
                    'token' => $token,
                    'normalizedToken' => $normalizedToken,
                    'status' => 'invalid',
                    'child_sequence_id' => null,
                    'reason' => 'unknown_move',
                ];

                $pendingConnector = null;
                ++$cursor;
                continue;
            }

            $resolvedMoves[] = [
                'token' => $token,
                'normalizedToken' => $normalizedToken,
                'leafId' => $leaf['id'],
                'moveType' => $leaf['moveType'],
                'connector' => $pendingConnector,
                'cancelTypeCodes' => $leaf['cancelTypeCodes'],
                'notation' => $leaf['notation'],
                'parsedTokenIndex' => count($parsedTokens),
            ];

            $parsedTokens[] = [
                'index' => $cursor + 1,
                'token' => $token,
                'normalizedToken' => $normalizedToken,
                'status' => 'parsed',
                'child_sequence_id' => $leaf['id'],
                'reason' => null,
            ];

            $pendingConnector = null;
            ++$cursor;
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
                    $move['moveType'],
                    $previousMove['cancelTypeCodes'],
                    $move['cancelTypeCodes'],
                    $move['normalizedToken'],
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
     * @param array<int, array{id:int, notation:string, moveType:string|null, cancelTypeCodes?:array<int, string>, aliases?:array<int, string>}> $leafOptions
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
     * @param array<int, array{id:int, notation:string, moveType:string|null, cancelTypeCodes?:array<int, string>, aliases?:array<int, string>}> $leafOptions
     * @param array<int, string> $warnings
     *
     * @return array<string, array{id:int, notation:string, moveType:string|null, cancelTypeCodes:array<int, string>}>
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
                'notation' => $leaf['notation'],
                'moveType' => $leaf['moveType'],
                'cancelTypeCodes' => $this->normalizeCancelTypeCodes($leaf['cancelTypeCodes'] ?? []),
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
     * @param array<int, array{id:int, notation:string, moveType:string|null, cancelTypeCodes?:array<int, string>, aliases?:array<int, string>}> $leafOptions
     * @param array<int, string> $warnings
     *
     * @return array<int, array{normalizedAlias:string, tokenCount:int, rawAlias:string, leaf:array{id:int, notation:string, moveType:string|null, cancelTypeCodes:array<int, string>}}>
     */
    private function buildLeafAliases(array $leafOptions, array &$warnings): array
    {
        $aliases = [];
        foreach ($leafOptions as $leaf) {
            $leafMeta = [
                'id' => $leaf['id'],
                'notation' => $leaf['notation'],
                'moveType' => $leaf['moveType'],
                'cancelTypeCodes' => $this->normalizeCancelTypeCodes($leaf['cancelTypeCodes'] ?? []),
            ];

            $rawAliases = [$leaf['notation']];
            foreach ($leaf['aliases'] ?? [] as $extraAlias) {
                if (is_string($extraAlias)) {
                    $rawAliases[] = $extraAlias;
                }
            }

            foreach ($rawAliases as $rawAlias) {
                $normalizedAlias = $this->normalizeNotationToken($rawAlias);
                if ('' === $normalizedAlias) {
                    continue;
                }

                $aliases[] = [
                    'normalizedAlias' => $normalizedAlias,
                    'tokenCount' => $this->countAliasTokens($rawAlias),
                    'rawAlias' => (string) $rawAlias,
                    'leaf' => $leafMeta,
                ];
            }
        }

        usort(
            $aliases,
            static function (array $a, array $b): int {
                $lengthComparison = strlen($b['normalizedAlias']) <=> strlen($a['normalizedAlias']);
                if (0 !== $lengthComparison) {
                    return $lengthComparison;
                }

                $tokenCountComparison = $b['tokenCount'] <=> $a['tokenCount'];
                if (0 !== $tokenCountComparison) {
                    return $tokenCountComparison;
                }

                return strcmp($b['normalizedAlias'], $a['normalizedAlias']);
            }
        );

        return $aliases;
    }

    /**
     * @param array<int, array{normalizedAlias:string, tokenCount:int, rawAlias:string, leaf:array{id:int, notation:string, moveType:string|null, cancelTypeCodes:array<int, string>}}> $leafAliases
     *
     * @return array{tokenCount:int, rawToken:string, normalizedToken:string, leaf:array{id:int, notation:string, moveType:string|null, cancelTypeCodes:array<int, string>}}|null
     */
    private function matchLongestAliasAtCursor(array $tokens, int $cursor, array $leafAliases): ?array
    {
        foreach ($leafAliases as $alias) {
            $tokenCount = $alias['tokenCount'];
            if ($tokenCount < 1) {
                continue;
            }

            $segmentTokens = array_slice($tokens, $cursor, $tokenCount);
            if (count($segmentTokens) !== $tokenCount) {
                continue;
            }

            $normalizedSegment = $this->normalizeNotationToken(implode(' ', $segmentTokens));
            if ($this->normalizeForAliasComparison($normalizedSegment) !== $this->normalizeForAliasComparison($alias['normalizedAlias'])) {
                continue;
            }

            return [
                'tokenCount' => $tokenCount,
                'rawToken' => $this->formatAliasToken($alias['rawAlias']),
                'normalizedToken' => $normalizedSegment,
                'leaf' => $alias['leaf'],
            ];
        }

        return null;
    }

    private function countAliasTokens(string $alias): int
    {
        $tokens = $this->tokenizeNotation($alias);

        return count($tokens);
    }

    private function normalizeForAliasComparison(string $normalizedToken): string
    {
        return str_replace('>', self::CONNECTOR_CANCEL, $normalizedToken);
    }

    private function formatAliasToken(string $token): string
    {
        return preg_replace('/\s*>\s*/', ' > ', $token) ?? $token;
    }

    /**
     * @param array<int, array{normalizedAlias:string, leaf:array{id:int, notation:string, moveType:string|null, cancelTypeCodes:array<int, string>}}> $leafAliases
     *
     * @return array<string, array{id:int, notation:string, moveType:string|null, cancelTypeCodes:array<int, string>}>
     */
    private function buildLeafAliasIndex(array $leafAliases): array
    {
        $index = [];
        foreach ($leafAliases as $alias) {
            $normalizedAlias = $this->normalizeForAliasComparison($alias['normalizedAlias']);
            $index[$normalizedAlias] ??= $alias['leaf'];
        }

        return $index;
    }

    /**
     * @param array<int, array{token:string, normalizedToken:string, leafId:int, moveType:string|null, connector:string|null, cancelTypeCodes:array<int, string>, notation:string, parsedTokenIndex:int}> $resolvedMoves
     * @param array<string, array{id:int, notation:string, moveType:string|null, cancelTypeCodes:array<int, string>}> $leafAliasIndex
     *
     * @return array{token:string, normalizedToken:string, move:array{token:string, normalizedToken:string, leafId:int, moveType:string|null, connector:string|null, cancelTypeCodes:array<int, string>, notation:string, parsedTokenIndex:int}}|null
     */
    private function resolveContextualTargetComboComposite(
        array $resolvedMoves,
        string $normalizedToken,
        ?string $pendingConnector,
        array $leafAliasIndex
    ): ?array {
        if ([] === $resolvedMoves) {
            return null;
        }

        $previousMove = $resolvedMoves[count($resolvedMoves) - 1];
        $button = $this->extractTargetComboFollowUpButton($normalizedToken);
        if (null === $button) {
            return null;
        }

        if ($this->isNormalMoveType($previousMove['moveType']) && !in_array('tc', $previousMove['cancelTypeCodes'], true)) {
            return null;
        }

        foreach ($this->buildCompositeAliasCandidates($previousMove['notation'], $normalizedToken, $button) as $candidate) {
            $normalizedCandidate = $this->normalizeForAliasComparison($this->normalizeNotationToken($candidate));
            $leaf = $leafAliasIndex[$normalizedCandidate] ?? null;
            if (null === $leaf) {
                continue;
            }

            return [
                'token' => $candidate,
                'normalizedToken' => $this->normalizeNotationToken($candidate),
                'move' => [
                    'token' => $candidate,
                    'normalizedToken' => $this->normalizeNotationToken($candidate),
                    'leafId' => $leaf['id'],
                    'moveType' => $leaf['moveType'],
                    'connector' => $previousMove['connector'],
                    'cancelTypeCodes' => $leaf['cancelTypeCodes'],
                    'notation' => $leaf['notation'],
                    'parsedTokenIndex' => $previousMove['parsedTokenIndex'],
                ],
            ];
        }

        return null;
    }

    private function extractTargetComboFollowUpButton(string $normalizedToken): ?string
    {
        if (preg_match('/^[1-9]?(LP|MP|HP|LK|MK|HK|P|K|PP|KK|PPP|KKK)$/', $normalizedToken, $matches) !== 1) {
            return null;
        }

        return $matches[1];
    }

    /**
     * @param array<string, array{id:int, notation:string, moveType:string|null, cancelTypeCodes:array<int, string>}> $leafIndex
     *
     * @return array{id:int, notation:string, moveType:string|null, cancelTypeCodes:array<int, string>}|null
     */
    private function findLeafByNormalizedToken(string $normalizedToken, array $leafIndex): ?array
    {
        if (isset($leafIndex[$normalizedToken])) {
            return $leafIndex[$normalizedToken];
        }

        foreach ($this->buildGenericStrengthCandidates($normalizedToken) as $candidate) {
            if (isset($leafIndex[$candidate])) {
                return $leafIndex[$candidate];
            }
        }

        return null;
    }

    /**
     * @param array<int, array{token:string, normalizedToken:string, leafId:int, moveType:string|null, connector:string|null, cancelTypeCodes:array<int, string>, notation:string, parsedTokenIndex:int}> $resolvedMoves
     * @param array<string, array{id:int, notation:string, moveType:string|null, cancelTypeCodes:array<int, string>}> $leafIndex
     *
     * @return array{kind:'none'|'connector'|'move', leaf?:array{id:int, notation:string, moveType:string|null, cancelTypeCodes:array<int, string>}}
     */
    private function resolveDriveRushToken(
        string $normalizedToken,
        array $resolvedMoves,
        ?string $pendingConnector,
        array $leafIndex,
        string $rawToken,
        array &$warnings
    ): array {
        if ('DRC' === $normalizedToken) {
            return ['kind' => 'connector'];
        }

        if (!$this->isRawDriveRushMove($normalizedToken)) {
            return ['kind' => 'none'];
        }

        $previousMove = [] === $resolvedMoves ? null : $resolvedMoves[count($resolvedMoves) - 1];
        if ('cancel' === $pendingConnector && null !== $previousMove && !$this->isSpecialLikeMoveType($previousMove['moveType'])) {
            return ['kind' => 'connector'];
        }

        $leaf = $leafIndex['DR'] ?? null;
        if (null === $leaf) {
            return ['kind' => 'connector'];
        }

        if (null === $pendingConnector && null !== $previousMove && $this->isNormalMoveType($previousMove['moveType'])) {
            $warnings[] = sprintf('Token "%s" after a normal was parsed as Raw Drive Rush. If you meant DRC, write either "xx DR" or "DRC".', $rawToken);
        }

        return ['kind' => 'move', 'leaf' => $leaf];
    }

    private function isRawDriveRushMove(string $normalizedToken): bool
    {
        return in_array($normalizedToken, ['DR', 'DRIVERUSH', 'RAWDRIVERUSH'], true);
    }

    /**
     * @return array<int, string>
     */
    private function buildGenericStrengthCandidates(string $normalizedToken): array
    {
        $candidates = [];
        if (preg_match('/^(.*)(L|M|H)(P|K)$/', $normalizedToken, $matches) === 1) {
            $candidates[] = $matches[1] . $matches[3];
        }

        return $candidates;
    }

    /**
     * @return array<int, string>
     */
    private function buildCompositeAliasCandidates(string $previousNotation, string $normalizedToken, string $button): array
    {
        return array_values(array_unique([
            sprintf('%s > %s', $previousNotation, $button),
            sprintf('%s > %s', $previousNotation, $normalizedToken),
        ]));
    }

    /**
     * @return array<int, string>
     */
    private function tokenizeNotation(string $notation): array
    {
        $notation = preg_replace('/\b(?:raw\s+)?drive\s+rush\s+cancel\b/i', ' DRC ', $notation) ?? $notation;
        $notation = preg_replace('/\bdr\s+cancel\b/i', ' DRC ', $notation) ?? $notation;
        $notation = preg_replace('/\braw\s+drive\s+rush\b/i', ' DR ', $notation) ?? $notation;
        $notation = preg_replace('/\bdrive\s+rush\b/i', ' DR ', $notation) ?? $notation;
        $prepared = preg_replace('/(XX|TC|DRC?|>)/i', ' $1 ', $notation) ?? $notation;
        $tokens = preg_split('/[\s,]+/', trim($prepared));

        if (false === $tokens) {
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
            'DR', 'DRC' => 'drive_rush_cancel',
            self::CONNECTOR_ARROW => 'cancel',
            self::CONNECTOR_CANCEL => 'cancel',
            self::CONNECTOR_TARGET_COMBO => 'target_combo',
            default => null,
        };
    }

    /**
     * @param array<int, string> $previousMoveCancelTypeCodes
     * @param array<int, string> $currentMoveCancelTypeCodes
     */
    private function inferConnection(
        ?string $explicitConnector,
        ?string $previousMoveType,
        ?string $currentMoveType,
        array $previousMoveCancelTypeCodes,
        array $currentMoveCancelTypeCodes,
        string $currentNormalizedToken,
    ): string
    {
        if ('target_combo' === $explicitConnector) {
            return 'target_combo';
        }

        if ($this->isRawDriveRushMove($currentNormalizedToken)) {
            return 'link';
        }

        if ('cancel' === $explicitConnector) {
            return $this->isSuperMoveType($currentMoveType) ? 'super_cancel' : 'special_cancel';
        }

        if ('drive_rush_cancel' === $explicitConnector) {
            return 'drive_rush_cancel';
        }

        $candidateConnections = [];

        if ($this->isChainCandidate(
            $previousMoveType,
            $currentMoveType,
            $previousMoveCancelTypeCodes,
            $currentMoveCancelTypeCodes,
        )) {
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

    /**
     * @param array<int, string> $previousMoveCancelTypeCodes
     * @param array<int, string> $currentMoveCancelTypeCodes
     */
    private function isChainCandidate(
        ?string $previousMoveType,
        ?string $currentMoveType,
        array $previousMoveCancelTypeCodes,
        array $currentMoveCancelTypeCodes,
    ): bool
    {
        if (!$this->isNormalMoveType($previousMoveType) || !$this->isNormalMoveType($currentMoveType)) {
            return false;
        }

        return in_array('ch', $previousMoveCancelTypeCodes, true) && in_array('ch', $currentMoveCancelTypeCodes, true);
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

    private function isNormalMoveType(?string $moveType): bool
    {
        if (null === $moveType) {
            return false;
        }

        return 'normal' === strtolower($moveType);
    }

    private function isSpecialLikeMoveType(?string $moveType): bool
    {
        if (null === $moveType) {
            return false;
        }

        return in_array(strtolower($moveType), ['special', 'movement-special', 'command-grab', 'super', 'drive'], true);
    }

    /**
     * @param array<int, mixed> $codes
     *
     * @return array<int, string>
     */
    private function normalizeCancelTypeCodes(array $codes): array
    {
        $normalizedCodes = [];
        foreach ($codes as $code) {
            if (!is_string($code)) {
                continue;
            }

            $normalizedCode = strtolower(trim($code));
            if ('' === $normalizedCode || in_array($normalizedCode, $normalizedCodes, true)) {
                continue;
            }

            $normalizedCodes[] = $normalizedCode;
        }

        return $normalizedCodes;
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
            'drive_rush_cancel' => ['drcancel', 'driverushcancel', 'drc'],
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

        if (in_array($normalized, ['drcancel', 'driverushcancel', 'drc'], true)) {
            return 'DRC';
        }

        return null;
    }
}
