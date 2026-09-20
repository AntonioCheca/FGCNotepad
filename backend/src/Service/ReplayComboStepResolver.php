<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Character;
use App\Entity\ComboSequences;
use App\Entity\ConnectionType;
use App\Repository\ComboSequencesRepository;
use App\Repository\ConnectionTypeRepository;
use App\Util\ReplayMoveNotation;

/**
 * Turns the ordered `sequence` of a combo export into FGCNotepad combo steps.
 *
 * Moves resolve to catalogue leaves; the export's per-step `connection` picks the connection type, walking
 * becomes a timed Walk Forward / Walk Back connection on the next move, target-combo hops collapse into the
 * catalogue's single target leaf ("5MP > 5MK"), and dashes and jumps are the catalogue's movement moves.
 */
final class ReplayComboStepResolver
{
    private const CONNECTION_KEYS = [
        'initial' => 'initialmove',
        'link' => 'link',
        'chain' => 'chain',
        'special' => 'special',
        'super' => 'supercancel',
        'drc' => 'driverushcancel',
        'walk_forward' => 'walkforward',
        'walk_back' => 'walkback',
    ];

    /** Export `connection` value -> internal connection. `target_combo` is handled by collapsing the hop. */
    private const EXPORT_CONNECTIONS = [
        'link' => 'link',
        'chain_cancel' => 'chain',
        'special_cancel' => 'special',
        'super_cancel' => 'super',
        'drive_rush_cancel' => 'drc',
    ];

    public function __construct(
        private readonly ComboSequencesRepository $comboSequencesRepository,
        private readonly ConnectionTypeRepository $connectionTypeRepository,
    ) {
    }

    /**
     * @param list<mixed> $sourceSteps
     *
     * @return array{steps: list<array<string, mixed>>, notation: string, notes: list<string>}
     */
    public function resolve(array $sourceSteps, Character $character): array
    {
        $leafsByKey = $this->leafsByKey($character);
        $connectionTypes = $this->connectionTypesByKey();

        /** @var list<array{leaf: ComboSequences, connection: string, delay: int|null, root: string, chain: string|null, label: string, special: bool, pending: bool}> $resolved */
        $resolved = [];
        $pendingDriveRushCancel = false;
        $pendingWalk = null;
        $previousExportKind = null;
        $notes = [];

        foreach ($sourceSteps as $index => $sourceStep) {
            if (!is_array($sourceStep)) {
                throw new \InvalidArgumentException(sprintf('sequence step %d must be an object.', $index + 1));
            }

            $kind = is_string($sourceStep['kind'] ?? null) ? $sourceStep['kind'] : '';
            if ('' === trim($kind)) {
                throw new \InvalidArgumentException('kind must be a non-empty string.');
            }

            if ('unmapped' === $kind) {
                throw new \InvalidArgumentException('sequence contains an unmapped move.');
            }

            if ('drive_rush_cancel' === $kind) {
                if ([] === $resolved || $pendingDriveRushCancel) {
                    throw new \InvalidArgumentException('drive_rush_cancel must appear between resolved moves.');
                }
                $pendingDriveRushCancel = true;
                $previousExportKind = $kind;
                continue;
            }

            if ('walk' === $kind) {
                if ([] !== $resolved) {
                    $frames = is_int($sourceStep['duration_samples'] ?? null) && $sourceStep['duration_samples'] >= 0 ? $sourceStep['duration_samples'] : null;
                    $pendingWalk = ['connection' => 'back' === ($sourceStep['direction'] ?? null) ? 'walk_back' : 'walk_forward', 'frames' => $frames];
                }
                continue;
            }

            if (!in_array($kind, ['move', 'drive_rush', 'dash', 'jump'], true)) {
                continue; // Unknown or future connective kinds are ignored, never a failure.
            }

            [$key, $label] = $this->keyAndLabel($kind, $sourceStep);
            if (null === $key) {
                continue;
            }

            if ('move' === $kind && $this->isTargetCombo($sourceStep)) {
                $this->collapseTargetHop($resolved, $sourceStep, $leafsByKey, $character);
                $previousExportKind = $kind;
                continue;
            }

            $this->assertTargetChainResolved($resolved, $character);

            $leaf = $this->findLeaf($leafsByKey, $key, $sourceStep, $character, $notes, $kind);
            if (null === $leaf) {
                continue; // A dash/jump whose movement leaf is not in the catalogue: noted, not fatal.
            }

            $delay = null;
            if ([] === $resolved) {
                $connection = 'initial';
            } elseif ($pendingDriveRushCancel) {
                $connection = 'drc';
            } elseif (null !== $pendingWalk) {
                $connection = $pendingWalk['connection'];
                $delay = $pendingWalk['frames'];
            } else {
                $connection = $this->connectionFor($sourceStep, $key, $previousExportKind, $resolved[array_key_last($resolved)], $notes, $label);
            }

            $resolved[] = [
                'leaf' => $leaf,
                'connection' => $connection,
                'delay' => $delay,
                'root' => $key,
                'chain' => null,
                'label' => 'drive_rush' === $kind ? $label : ($leaf->getMove()?->getNumpadNotation() ?? $label),
                'special' => 1 === preg_match('/^\d{2,}[A-Z]/', $key),
                'pending' => false,
            ];
            $pendingDriveRushCancel = false;
            $pendingWalk = null;
            $previousExportKind = $kind;
        }

        if ($pendingDriveRushCancel) {
            throw new \InvalidArgumentException('drive_rush_cancel must be followed by a move.');
        }
        $this->assertTargetChainResolved($resolved, $character);

        return [
            'steps' => $this->buildSteps($resolved, $connectionTypes),
            'notation' => $this->notation($resolved),
            'notes' => $notes,
        ];
    }

    /**
     * @param list<array{leaf: ComboSequences, connection: string, delay: int|null, root: string, chain: string|null, label: string, special: bool, pending: bool}> $resolved
     * @param array<string, mixed> $sourceStep
     * @param array<string, list<ComboSequences>> $leafsByKey
     */
    private function collapseTargetHop(array &$resolved, array $sourceStep, array $leafsByKey, Character $character): void
    {
        $target = is_string($sourceStep['target_notation'] ?? null) ? trim($sourceStep['target_notation']) : '';
        if ('' === $target) {
            throw new \InvalidArgumentException('Target combo hop was not named by the extractor (no target_notation).');
        }
        $parts = array_map('trim', explode('>', $target));
        if (count($parts) < 2 || '' === $parts[0] || '' === $parts[1]) {
            throw new \InvalidArgumentException(sprintf('Target combo notation "%s" is not understood.', $target));
        }

        $last = $resolved[array_key_last($resolved)] ?? null;
        if (null === $last || $last['root'] !== ReplayMoveNotation::key($parts[0])) {
            throw new \InvalidArgumentException(sprintf('Target combo hop "%s" does not follow its first hit.', $target));
        }

        // Consecutive hops compose: "5HK > HP" then "5HK > HK" is the leaf "5HK > HP > HK".
        $chain = null !== $last['chain'] ? $last['chain'] . ' > ' . $parts[1] : $target;
        $chainParts = array_map('trim', explode('>', $chain));
        $candidates = [ReplayMoveNotation::key($chain)];
        $stance = 1 === preg_match('/^(\d)/', ReplayMoveNotation::key($chainParts[0]), $matches) ? $matches[1] : '';
        if ('' !== $stance) {
            $candidates[] = ReplayMoveNotation::key(implode(' > ', array_merge([$chainParts[0]], array_map(static fn (string $part): string => $stance . $part, array_slice($chainParts, 1)))));
        }

        foreach ($candidates as $candidateKey) {
            $matches = $leafsByKey[$candidateKey] ?? [];
            if (1 === count($matches)) {
                $entry = array_pop($resolved);
                $entry['leaf'] = $matches[0];
                $entry['chain'] = $chain;
                $entry['pending'] = false;
                $entry['label'] = $matches[0]->getMove()?->getNumpadNotation() ?? $chain;
                $resolved[] = $entry;

                return;
            }
        }

        // No leaf for this hop alone: a later hop may complete the chain ("5HK > HP" then "5HK > HK").
        $entry = array_pop($resolved);
        $entry['chain'] = $chain;
        $entry['pending'] = true;
        $resolved[] = $entry;
    }

    /** @param list<array{leaf: ComboSequences, connection: string, delay: int|null, root: string, chain: string|null, label: string, special: bool, pending: bool}> $resolved */
    private function assertTargetChainResolved(array $resolved, Character $character): void
    {
        $last = $resolved[array_key_last($resolved)] ?? null;
        if (null !== $last && true === $last['pending']) {
            throw new \InvalidArgumentException(sprintf('Target leaf missing in the catalogue for %s: "%s".', $character->getName(), (string) $last['chain']));
        }
    }

    /** @param array<string, mixed> $sourceStep */
    private function isTargetCombo(array $sourceStep): bool
    {
        return 'target_combo' === ($sourceStep['relation_kind'] ?? null) || 'target_combo' === ($sourceStep['connection'] ?? null);
    }

    /**
     * @param array<string, mixed> $sourceStep
     *
     * @return array{0: string|null, 1: string}
     */
    private function keyAndLabel(string $kind, array $sourceStep): array
    {
        if ('drive_rush' === $kind) {
            return ['DR', '[DR]'];
        }
        if ('dash' === $kind) {
            $key = 'back' === ($sourceStep['direction'] ?? null) ? '44' : '66';

            return [$key, $key];
        }
        if ('jump' === $kind) {
            $direction = $sourceStep['direction'] ?? null;
            $key = 'forward' === $direction ? '9' : ('back' === $direction ? '7' : '8');

            return [$key, $key];
        }

        $notation = $sourceStep['notation'] ?? null;
        if (!is_string($notation) || '' === trim($notation)) {
            throw new \InvalidArgumentException('A move step has no notation.');
        }

        return [ReplayMoveNotation::key($notation), $notation];
    }

    /**
     * @param array<string, list<ComboSequences>> $leafsByKey
     * @param array<string, mixed> $sourceStep
     * @param list<string> $notes
     */
    private function findLeaf(array $leafsByKey, string $key, array $sourceStep, Character $character, array &$notes, string $kind): ?ComboSequences
    {
        $matches = $leafsByKey[$key] ?? [];
        if ([] === $matches && null !== ($jumpKey = ReplayMoveNotation::jumpAliasKey($key))) {
            $matches = $leafsByKey[$jumpKey] ?? [];
        }

        if ([] === $matches) {
            if (in_array($kind, ['dash', 'jump'], true)) {
                $notes[] = sprintf('%s step skipped: no "%s" move in the catalogue.', $kind, $key);

                return null;
            }
            $notation = (string) ($sourceStep['notation'] ?? $key);
            if (ReplayMoveNotation::isStrengthAgnostic($key)) {
                throw new \InvalidArgumentException(sprintf('Notation "%s" does not say which strength was used, so it cannot be matched to one %s move.', $notation, $character->getName()));
            }

            throw new \InvalidArgumentException(sprintf('No leaf move matches notation "%s" for %s.', $notation, $character->getName()));
        }

        if (count($matches) > 1) {
            throw new \InvalidArgumentException(sprintf('Notation "%s" is ambiguous for %s.', (string) ($sourceStep['notation'] ?? $key), $character->getName()));
        }

        return $matches[0];
    }

    /**
     * @param array<string, mixed> $sourceStep
     * @param array{leaf: ComboSequences, connection: string, delay: int|null, root: string, chain: string|null, label: string, special: bool, pending: bool} $previous
     * @param list<string> $notes
     */
    private function connectionFor(array $sourceStep, string $key, ?string $previousExportKind, array $previous, array &$notes, string $label): string
    {
        $exported = $sourceStep['connection'] ?? null;
        if (is_string($exported) && isset(self::EXPORT_CONNECTIONS[$exported])) {
            return self::EXPORT_CONNECTIONS[$exported];
        }

        // The extractor could not classify it; when in doubt the connection is Link.
        if ('drive_rush' === $previousExportKind) {
            return 'link';
        }
        $enteredFrom = $sourceStep['entered_from'] ?? null;
        if (in_array($enteredFrom, ['JUMP_LAND', 'ATCK_LAND'], true)) {
            return 'link';
        }
        if ($previous['special'] && str_starts_with($key, 'J.')) {
            return 'special'; // Jump cancel of a special or super.
        }
        if ('SUPER' === $enteredFrom && 1 === preg_match('/^\d{5,}/', $key)) {
            return 'super';
        }

        $notes[] = sprintf('Connection into %s was not classified by the extractor (Link used).', $label);

        return 'link';
    }

    /**
     * @param list<array{leaf: ComboSequences, connection: string, delay: int|null, root: string, chain: string|null, label: string, special: bool, pending: bool}> $resolved
     * @param array<string, ConnectionType> $connectionTypes
     *
     * @return list<array<string, mixed>>
     */
    private function buildSteps(array $resolved, array $connectionTypes): array
    {
        $steps = [];
        foreach ($resolved as $index => $entry) {
            $connectionType = $connectionTypes[self::CONNECTION_KEYS[$entry['connection']]] ?? null;
            if (!$connectionType instanceof ConnectionType || null === $connectionType->getId()) {
                throw new \InvalidArgumentException(sprintf('Required connection type "%s" is not configured.', self::CONNECTION_KEYS[$entry['connection']]));
            }
            $leafId = $entry['leaf']->getId();
            if (null === $leafId) {
                throw new \InvalidArgumentException('A leaf move has not been persisted.');
            }

            $step = [
                'child_sequence_id' => $leafId,
                'ordinal_in_combo' => $index + 1,
                'connection_type_id' => $connectionType->getId(),
            ];
            if (null !== $entry['delay']) {
                // Samples are close to frames but not verified as frames.
                $step += ['delay_min_frames' => $entry['delay'], 'delay_max_frames' => $entry['delay'], 'delay_min_unverified' => true, 'delay_max_unverified' => true];
            }
            $steps[] = $step;
        }

        return $steps;
    }

    /** @param list<array{leaf: ComboSequences, connection: string, delay: int|null, root: string, chain: string|null, label: string, special: bool, pending: bool}> $resolved */
    private function notation(array $resolved): string
    {
        $parts = [];
        foreach ($resolved as $entry) {
            if ('drc' === $entry['connection']) {
                $parts[] = '[DRC]';
            } elseif (in_array($entry['connection'], ['walk_forward', 'walk_back'], true)) {
                $parts[] = '[walk]';
            }
            $parts[] = $entry['label'];
        }

        return implode(' > ', $parts);
    }

    /** @return array<string, list<ComboSequences>> */
    private function leafsByKey(Character $character): array
    {
        $byKey = [];
        foreach ($this->comboSequencesRepository->findLeafsByCharacterId((string) $character->getId()) as $leaf) {
            $notation = $leaf->getMove()?->getNumpadNotation();
            if (null !== $notation) {
                $byKey[ReplayMoveNotation::key($notation)][] = $leaf;
            }
        }

        return $byKey;
    }

    /** @return array<string, ConnectionType> */
    private function connectionTypesByKey(): array
    {
        $types = [];
        foreach ($this->connectionTypeRepository->findAll() as $connectionType) {
            if ($connectionType instanceof ConnectionType) {
                $types[(string) preg_replace('/[^a-z0-9]/', '', strtolower((string) $connectionType->getName()))] = $connectionType;
            }
        }
        // The catalogue names this type "DR Cancel".
        if (!isset($types['driverushcancel']) && isset($types['drcancel'])) {
            $types['driverushcancel'] = $types['drcancel'];
        }

        return $types;
    }
}
