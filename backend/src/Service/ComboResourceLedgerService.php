<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\CharacterObject;
use App\Entity\CharacterObjectState;
use App\Entity\ComboResourceUsage;
use App\Entity\ComboSequences;
use App\Entity\Move;
use App\Entity\MoveResourceEffect;
use App\Entity\Step;
use App\Repository\ComboResourceUsageRepository;
use App\Repository\MoveResourceEffectRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Walks a combo's moves against their resource effects: where each resource starts, what every step spends or
 * gains, and where it ends. Start value = the combo's declared status requirement, else the resource's default.
 * A combo whose steps carry observed resource changes (from a replay) is walked from those instead.
 */
class ComboResourceLedgerService
{
    public function __construct(
        private readonly MoveResourceEffectRepository $effectRepository,
        private readonly ComboResourceUsageRepository $usageRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * Pure calculation.
     *
     * @param array<int, array{id:int, object_key:string, name:string, kind:string, min:int, max:int|null, starts_with:int}> $resources keyed by resource id
     * @param list<array{ordinal:int, notation:string, effects:list<array{resource_id:int, mode:string, amount:int}>}> $steps
     * @param array<int, int> $declaredStarts resource id => start value
     *
     * @return list<array<string, mixed>>
     */
    public function calculate(array $resources, array $steps, array $declaredStarts = []): array
    {
        $ledger = [];
        foreach ($steps as $step) {
            foreach ($step['effects'] as $effect) {
                $resource = $resources[$effect['resource_id']] ?? null;
                if (null === $resource) {
                    continue;
                }

                $id = $resource['id'];
                $ledger[$id] ??= [
                    'resource' => $resource,
                    'start' => $declaredStarts[$id] ?? $resource['starts_with'],
                    'current' => $declaredStarts[$id] ?? $resource['starts_with'],
                    'spent' => 0,
                    'gained' => 0,
                    'steps' => [],
                    'warnings' => [],
                ];

                $before = $ledger[$id]['current'];
                $target = 'set' === $effect['mode'] ? $effect['amount'] : $before + $effect['amount'];
                $after = max($resource['min'], null === $resource['max'] ? $target : min($resource['max'], $target));
                if ($after !== $target) {
                    $ledger[$id]['warnings'][] = sprintf('Step %d (%s) would take %s to %d; limited to %d.', $step['ordinal'], $step['notation'], $resource['name'], $target, $after);
                }

                $delta = $after - $before;
                $ledger[$id]['spent'] += max(0, -$delta);
                $ledger[$id]['gained'] += max(0, $delta);
                $ledger[$id]['current'] = $after;
                $ledger[$id]['steps'][] = ['ordinal' => $step['ordinal'], 'notation' => $step['notation'], 'delta' => $delta, 'before' => $before, 'after' => $after];
            }
        }

        return array_values(array_map(static fn (array $entry): array => [
            'resource' => [
                'id' => $entry['resource']['id'],
                'object_key' => $entry['resource']['object_key'],
                'name' => $entry['resource']['name'],
                'kind' => $entry['resource']['kind'],
                'min_status' => $entry['resource']['min'],
                'max_status' => $entry['resource']['max'],
            ],
            'start' => $entry['start'],
            'end' => $entry['current'],
            'spent' => $entry['spent'],
            'gained' => $entry['gained'],
            'steps' => $entry['steps'],
            'warnings' => $entry['warnings'],
        ], $ledger));
    }

    /** @return list<array<string, mixed>> */
    public function forCombo(ComboSequences $combo): array
    {
        $steps = $this->orderedSteps($combo);
        $starts = [];
        foreach ($combo->getComboRequirement()?->getCharacterObjectStates() ?? [] as $state) {
            if ($state instanceof CharacterObjectState && null !== $state->getStatusRequired() && null !== $state->getObjectKey()) {
                $starts[$state->getObjectKey()] = 'true' === $state->getStatusRequired() ? 1 : (int) $state->getStatusRequired();
            }
        }

        if ([] !== array_filter($steps, static fn (Step $step): bool => null !== $step->getResourceObject())) {
            return $this->forObservedSteps($steps, $starts);
        }

        return $this->forMoves(array_map(static fn (Step $step): ?Move => $step->getChildSequence()?->getMove(), $steps), $starts);
    }

    /**
     * Declared resources that no step changes are listed too, so a combo started at 4 Medals shows them.
     *
     * @param list<Step> $steps in combo order
     * @param array<string, int> $startsByObjectKey declared starting amounts
     *
     * @return list<array<string, mixed>>
     */
    private function forObservedSteps(array $steps, array $startsByObjectKey): array
    {
        $resources = [];
        $stepInputs = [];
        foreach ($steps as $index => $step) {
            $resource = $step->getResourceObject();
            $effects = [];
            if ($resource instanceof CharacterObject && null !== $step->getResourceDelta()) {
                $resources[(int) $resource->getId()] = $this->resourceInput($resource);
                $effects[] = ['resource_id' => (int) $resource->getId(), 'mode' => 'relative', 'amount' => $step->getResourceDelta()];
            }
            $stepInputs[] = ['ordinal' => $step->getOrdinalInCombo() ?? $index + 1, 'notation' => $step->getChildSequence()?->getMove()?->getNumpadNotation() ?? '?', 'effects' => $effects];
        }

        $ledger = $this->calculate($resources, $stepInputs, $this->declaredStartsById($resources, $startsByObjectKey));
        $listed = array_map(static fn (array $entry): string => $entry['resource']['object_key'], $ledger);
        foreach ($startsByObjectKey as $objectKey => $start) {
            $resource = in_array($objectKey, $listed, true) ? null : $this->entityManager->getRepository(CharacterObject::class)->findOneBy(['objectKey' => $objectKey]);
            if ($resource instanceof CharacterObject) {
                $ledger[] = $this->unchangedEntry($this->resourceInput($resource), $start);
            }
        }

        return $ledger;
    }

    /**
     * @param array{id:int, object_key:string, name:string, kind:string, min:int, max:int|null, starts_with:int} $resource
     *
     * @return array<string, mixed>
     */
    private function unchangedEntry(array $resource, int $start): array
    {
        return [
            'resource' => [
                'id' => $resource['id'],
                'object_key' => $resource['object_key'],
                'name' => $resource['name'],
                'kind' => $resource['kind'],
                'min_status' => $resource['min'],
                'max_status' => $resource['max'],
            ],
            'start' => $start,
            'end' => $start,
            'spent' => 0,
            'gained' => 0,
            'steps' => [],
            'warnings' => [],
        ];
    }

    /**
     * @param array<int, array{id:int, object_key:string, name:string, kind:string, min:int, max:int|null, starts_with:int}> $resources
     * @param array<string, int> $startsByObjectKey
     *
     * @return array<int, int> resource id => start value
     */
    private function declaredStartsById(array $resources, array $startsByObjectKey): array
    {
        $declared = [];
        foreach ($resources as $resource) {
            if (isset($startsByObjectKey[$resource['object_key']])) {
                $declared[$resource['id']] = $startsByObjectKey[$resource['object_key']];
            }
        }

        return $declared;
    }

    /**
     * @param list<Move|null> $moves in combo order
     * @param array<string, int> $startsByObjectKey declared starting amounts
     *
     * @return list<array<string, mixed>>
     */
    public function forMoves(array $moves, array $startsByObjectKey = []): array
    {
        $effectsByMove = $this->effectRepository->findGroupedByMove(array_values(array_filter($moves)));
        $resources = [];
        $stepInputs = [];
        foreach ($moves as $index => $move) {
            $effects = [];
            foreach ($move instanceof Move ? ($effectsByMove[(string) $move->getId()] ?? []) : [] as $effect) {
                $resource = $effect->getCharacterObject();
                $resources[(int) $resource->getId()] = $this->resourceInput($resource);
                $effects[] = ['resource_id' => (int) $resource->getId(), 'mode' => $effect->getMode(), 'amount' => $effect->getAmount()];
            }
            $stepInputs[] = ['ordinal' => $index + 1, 'notation' => $move instanceof Move ? $move->getNumpadNotation() : '?', 'effects' => $effects];
        }

        return $this->calculate($resources, $stepInputs, $this->declaredStartsById($resources, $startsByObjectKey));
    }

    /** Rewrites the stored usage rows of a combo from its current moves and effects (caller flushes). */
    public function syncUsage(ComboSequences $combo): void
    {
        $existingByResource = [];
        if (null !== $combo->getId()) {
            foreach ($this->usageRepository->findBy(['combo' => $combo]) as $existing) {
                $existingByResource[(int) $existing->getCharacterObject()->getId()] = $existing;
            }
        }

        foreach ($this->forCombo($combo) as $entry) {
            $resourceId = $entry['resource']['id'];
            $usage = $existingByResource[$resourceId] ?? (new ComboResourceUsage())
                ->setCombo($combo)
                ->setCharacterObject($this->entityManager->getReference(CharacterObject::class, $resourceId));
            unset($existingByResource[$resourceId]);

            $usage->setStartValue($entry['start'])->setSpent($entry['spent'])->setGained($entry['gained'])->setEndValue($entry['end']);
            $this->entityManager->persist($usage);
        }

        foreach ($existingByResource as $stale) {
            $this->entityManager->remove($stale);
        }
    }

    /** Called when a move's effects change: refreshes every combo that plays that move. */
    public function syncCombosContainingMove(Move $move): void
    {
        $combos = $this->entityManager->createQueryBuilder()
            ->select('DISTINCT combo')
            ->from(ComboSequences::class, 'combo')
            ->innerJoin('combo.steps', 'step')
            ->innerJoin('step.child_sequence', 'leaf')
            ->andWhere('leaf.move = :move')
            ->setParameter('move', $move)
            ->getQuery()
            ->getResult();

        foreach ($combos as $combo) {
            $this->syncUsage($combo);
        }
    }

    /** @return list<Step> */
    private function orderedSteps(ComboSequences $combo): array
    {
        $steps = $combo->getSteps()->toArray();
        usort($steps, static fn (Step $left, Step $right): int => ($left->getOrdinalInCombo() ?? 0) <=> ($right->getOrdinalInCombo() ?? 0));

        return $steps;
    }

    /** @return array{id:int, object_key:string, name:string, kind:string, min:int, max:int|null, starts_with:int} */
    private function resourceInput(CharacterObject $resource): array
    {
        $isState = CharacterObject::KIND_STATE === $resource->getKind();

        return [
            'id' => (int) $resource->getId(),
            'object_key' => (string) $resource->getObjectKey(),
            'name' => (string) $resource->getName(),
            'kind' => $resource->getKind(),
            'min' => $isState ? 0 : $resource->getMinStatus(),
            'max' => $isState ? 1 : $resource->getMaxStatus(),
            'starts_with' => $resource->getStartsWith(),
        ];
    }
}
