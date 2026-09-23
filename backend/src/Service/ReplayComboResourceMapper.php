<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Character;
use App\Entity\CharacterObject;
use App\Repository\CharacterObjectRepository;

/**
 * Translates a combo export's resource evidence (resources_at_start, resource_changes) into FGCNotepad terms:
 * declared starting states and one observed change per combo step. Export keys are matched through each
 * resource's extractor_key for the combo's character. Anything that cannot be placed becomes a warning,
 * never a rejection.
 */
final class ReplayComboResourceMapper
{
    private const STATE_DECLARED_KINDS = [CharacterObject::KIND_SCALER, CharacterObject::KIND_STATE];

    public function __construct(private readonly CharacterObjectRepository $characterObjectRepository)
    {
    }

    /**
     * @param array<string, mixed> $combo
     * @param list<list<int>> $sourceIndexes export sequence indexes folded into each step, in step order
     *
     * @return array{
     *     stepChanges: array<int, array{resource: CharacterObject, delta: int}>,
     *     objectStates: list<array{object_key: string, status_required: string}>,
     *     trace: array{starts: array<string, int>, steps: array<int, array{0: string, 1: int}>},
     *     warnings: list<string>
     * }
     */
    public function map(array $combo, Character $character, array $sourceIndexes): array
    {
        $resources = $this->resourcesFor($character);
        $warnings = [];
        $stepChanges = $this->stepChanges($combo['resource_changes'] ?? [], $resources, $sourceIndexes, $warnings);
        $changedKeys = array_map(static fn (array $change): string => (string) $change['resource']->getObjectKey(), $stepChanges);
        $starts = $this->declaredStarts($combo['resources_at_start'] ?? null, $resources, $changedKeys, $warnings);

        return [
            'stepChanges' => $stepChanges,
            'objectStates' => array_values(array_map(
                static fn (string $objectKey, int $value): array => ['object_key' => $objectKey, 'status_required' => (string) $value],
                array_keys($starts),
                $starts,
            )),
            'trace' => [
                'starts' => $starts,
                'steps' => array_map(static fn (array $change): array => [(string) $change['resource']->getObjectKey(), $change['delta']], $stepChanges),
            ],
            'warnings' => $warnings,
        ];
    }

    /** @return array{named: array<string, CharacterObject>, install: CharacterObject|null} */
    private function resourcesFor(Character $character): array
    {
        $named = [];
        $install = null;
        foreach ($this->characterObjectRepository->findBy(['character' => $character]) as $resource) {
            $key = trim((string) $resource->getExtractorKey());
            if (CharacterObject::SOURCE_INSTALL === $resource->getExtractorSource()) {
                $install = $resource;
            } elseif ('' !== $key) {
                $named[$key] = $resource;
            }
        }

        return ['named' => $named, 'install' => $install];
    }

    /**
     * @param array{named: array<string, CharacterObject>, install: CharacterObject|null} $resources
     * @param list<list<int>> $sourceIndexes
     * @param list<string> $warnings
     *
     * @return array<int, array{resource: CharacterObject, delta: int}> keyed by step ordinal
     */
    private function stepChanges(mixed $changes, array $resources, array $sourceIndexes, array &$warnings): array
    {
        if (!is_array($changes)) {
            $warnings[] = 'resource_changes is not a list; resource changes were not imported.';

            return [];
        }

        $ordinalByIndex = [];
        foreach ($sourceIndexes as $position => $indexes) {
            foreach ($indexes as $index) {
                $ordinalByIndex[$index] = $position + 1;
            }
        }

        $stepChanges = [];
        foreach ($changes as $change) {
            $key = is_array($change) && is_string($change['resource'] ?? null) ? $change['resource'] : null;
            $label = $key ?? 'an unmapped slot';
            if (!is_array($change) || !is_int($change['delta'] ?? null)) {
                $warnings[] = sprintf('Resource change on %s has no numeric delta and was not imported.', $label);
                continue;
            }
            if (true === ($change['ambiguous_attribution'] ?? false) || !is_int($change['sequence_step_index'] ?? null)) {
                $warnings[] = sprintf('Resource change %+d on %s is not attributed to a move and was not imported.', $change['delta'], $label);
                continue;
            }

            $resource = null === $key ? null : $this->resourceForKey($key, $resources);
            if (null === $resource) {
                $warnings[] = sprintf('Resource "%s" has no matching extractor key for this character; its %+d change was not imported.', $label, $change['delta']);
                continue;
            }

            $ordinal = $ordinalByIndex[$change['sequence_step_index']] ?? null;
            if (null === $ordinal) {
                $warnings[] = sprintf('%s change %+d is on sequence entry %d, which is not a stored step; it was not imported.', $resource->getName(), $change['delta'], $change['sequence_step_index']);
                continue;
            }

            $existing = $stepChanges[$ordinal] ?? null;
            if (null !== $existing && $existing['resource'] !== $resource) {
                $warnings[] = sprintf('Step %d changes both %s and %s; only %s was imported.', $ordinal, $existing['resource']->getName(), $resource->getName(), $existing['resource']->getName());
                continue;
            }

            $stepChanges[$ordinal] = ['resource' => $resource, 'delta' => ($existing['delta'] ?? 0) + $change['delta']];
        }

        ksort($stepChanges);

        return array_filter($stepChanges, static fn (array $change): bool => 0 !== $change['delta']);
    }

    /**
     * Only starts that differ from the resource default are declared: the ledger already assumes the default.
     * Stocks are declared only when the combo changes them; scalers and states always matter to the damage.
     *
     * @param array{named: array<string, CharacterObject>, install: CharacterObject|null} $resources
     * @param list<string> $changedKeys
     * @param list<string> $warnings
     *
     * @return array<string, int> object key => starting value
     */
    private function declaredStarts(mixed $atStart, array $resources, array $changedKeys, array &$warnings): array
    {
        if (!is_array($atStart)) {
            return [];
        }

        $observed = [];
        foreach (is_array($atStart['resources'] ?? null) ? $atStart['resources'] : [] as $key => $entry) {
            $value = is_array($entry) ? ($entry['value'] ?? null) : null;
            if (!is_int($value)) {
                continue;
            }
            $resource = $this->resourceForKey((string) $key, $resources);
            if (null === $resource) {
                if (0 !== $value) {
                    $warnings[] = sprintf('Resource "%s" (%d at start) has no matching extractor key for this character.', $key, $value);
                }
                continue;
            }
            $observed[] = [$resource, $value];
        }

        $install = is_array($atStart['install'] ?? null) ? $atStart['install'] : null;
        if (null !== $install && is_bool($install['active'] ?? null)) {
            if (null !== $resources['install']) {
                $observed[] = [$resources['install'], $install['active'] ? 1 : 0];
            } elseif ($install['active']) {
                $warnings[] = 'Install was active at the combo start, but this character has no install resource.';
            }
        }

        $starts = [];
        foreach ($observed as [$resource, $value]) {
            $objectKey = (string) $resource->getObjectKey();
            $matters = in_array($objectKey, $changedKeys, true) || in_array($resource->getKind(), self::STATE_DECLARED_KINDS, true);
            if (!$matters || $value === $resource->getStartsWith()) {
                continue;
            }
            if ($value < 1) {
                $warnings[] = sprintf('%s started at %d, below its default of %d; that start cannot be declared.', $resource->getName(), $value, $resource->getStartsWith());
                continue;
            }
            $starts[$objectKey] = $value;
        }
        ksort($starts);

        return $starts;
    }

    /** @param array{named: array<string, CharacterObject>, install: CharacterObject|null} $resources */
    private function resourceForKey(string $key, array $resources): ?CharacterObject
    {
        return 'install' === $key ? $resources['install'] : ($resources['named'][$key] ?? null);
    }
}
