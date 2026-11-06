<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Scenario;
use App\Entity\ScenarioCell;
use App\Entity\ScenarioColumn;
use App\Entity\ScenarioRow;
use App\Entity\User;

/**
 * Solves a scenario for one viewer (execution mode, difficulty cap, resources) together with every scenario its
 * reference cells reach, by fixed-point iteration (ScenarioLinkFixedPoint), so self-links and cycles terminate. A
 * linked scenario is solved with the resources left after the reference cell's preValue combo, so each
 * (scenario, resources) pair is its own node.
 *
 * @phpstan-import-type FixedPointLink from ScenarioLinkFixedPoint
 *
 * @phpstan-type ViewerReference array{id:int,row:int,column:int,cell:ScenarioCell,base:float,resourceContext:array<string,mixed>|null}
 * @phpstan-type ViewerNode array{scenario:Scenario,rowCount:int,columnCount:int,rowKeys:array<int,string>,columnKeys:array<int,string>,payoffs:array<int,array<int,float>>,links:array<int,array<int,int>>,references:list<ViewerReference>}
 */
class ScenarioLinkedExpectedValueResolverService
{
    /** Distinct (scenario, resources) nodes solved per request; links past it count the linked scenario's saved EV. */
    private const MAX_NODES = 32;

    /** Entries kept in each memo; batch callers such as the resource grid reuse them across many contexts. */
    private const MEMO_LIMIT = 50000;

    /** @var array<string, array{resolvedDamage:float|null,resolvedComboId:int|null,resolvedStarterMoveId:string|null,resourceContext:array<string,mixed>|null}> */
    private array $comboMemo = [];

    /** @var array<string, array<string, mixed>> */
    private array $solveMemo = [];

    /** @var array<string, array<string, mixed>> */
    private array $resolveMemo = [];

    public function __construct(
        private readonly MixedStrategyGameSolver $mixedStrategyGameSolver,
        private readonly ResolveDynamicComboCellService $resolveDynamicComboCellService,
        private readonly ScenarioComboContextService $scenarioComboContextService,
        private readonly ScenarioAxisResourceCostService $axisResourceCostService,
    ) {
    }

    /**
     * @param array<string, array<string, mixed>|null> $resourceContext
     *
     * @return array{scenarioId:string,expectedValue:float|null,rowAxis:list<float|null>,columnAxis:list<float|null>,resolvedCells:list<array<string, mixed>>,convergence:array{passes:int,lastPassDelta:float|null,settled:bool}}
     */
    public function resolve(
        Scenario $scenario,
        ?User $user = null,
        ?string $executionMode = null,
        ?int $difficultyCap = null,
        ?array $resourceContext = null,
        array $viewerContextPayload = [],
        ?int $passes = null,
    ): array {
        $seedKey = $this->nodeKey($scenario, $resourceContext);
        $nodes = [];
        $linksByNode = [];
        $queue = [[$seedKey, $scenario, $resourceContext]];
        $queued = [$seedKey => true];
        while ([] !== $queue) {
            [$key, $nodeScenario, $nodeResources] = array_shift($queue);
            $nodes[$key] = $this->buildNode($nodeScenario, $user, $executionMode, $difficultyCap, $nodeResources, $viewerContextPayload);
            $linksByNode[$key] = [];
            foreach ($nodes[$key]['references'] as $reference) {
                $linked = $reference['cell']->getReferenceScenario();
                $target = null === $linked ? null : $this->nodeKey($linked, $reference['resourceContext']);
                if (null !== $linked && null !== $target && !isset($queued[$target]) && count($queued) < self::MAX_NODES) {
                    $queue[] = [$target, $linked, $reference['resourceContext']];
                    $queued[$target] = true;
                }

                $linksByNode[$key][] = [
                    'id' => $reference['id'],
                    'base' => $reference['base'],
                    'factor' => $reference['cell']->getReferenceFactor(),
                    'target' => null !== $target && isset($queued[$target]) ? $target : null,
                    'initial' => $reference['cell']->getCachedValue() ?? $reference['base'],
                    'fallback' => null !== $linked ? $this->savedTopLayerExpectedValue($linked) : 0.0,
                ];
            }
        }

        $fingerprint = $this->fingerprint($nodes, $linksByNode, $seedKey, $passes);
        if (isset($this->resolveMemo[$fingerprint])) {
            return $this->resolveMemo[$fingerprint];
        }

        $fixedPoint = ScenarioLinkFixedPoint::iterate(
            $linksByNode,
            fn (string $key, array $values): ?float => $this->solveNode($nodes[$key], $values)['expectedValue'],
            ScenarioLinkFixedPoint::clampPasses($passes),
        );

        $seed = $nodes[$seedKey];
        $solved = $this->solveNode($seed, $fixedPoint['values']);
        $resolvedCells = [];
        foreach ($seed['references'] as $reference) {
            $cell = $reference['cell'];
            $resolvedCells[] = [
                'row' => $reference['row'],
                'column' => $reference['column'],
                'scenarioId' => $cell->getReferenceScenario()?->getPublicId()->toRfc4122(),
                'basePreValue' => $reference['base'],
                'linkedExpectedValue' => $fixedPoint['linkedExpectedValues'][$reference['id']] ?? 0.0,
                'weight' => $cell->getReferenceWeight(),
                'perspective' => $cell->getReferencePerspective(),
                'finalValue' => $fixedPoint['values'][$reference['id']] ?? $reference['base'],
            ];
        }

        $lastPassDelta = [] === $seed['references'] ? null : $fixedPoint['lastPassDeltas'][$seedKey];

        if (count($this->resolveMemo) >= self::MEMO_LIMIT) {
            $this->resolveMemo = [];
        }

        return $this->resolveMemo[$fingerprint] = [
            'scenarioId' => $scenario->getPublicId()->toRfc4122(),
            'expectedValue' => $solved['expectedValue'],
            'rowAxis' => $solved['rowAxis'],
            'columnAxis' => $solved['columnAxis'],
            'resolvedCells' => $resolvedCells,
            'convergence' => [
                'passes' => $fixedPoint['passes'],
                'lastPassDelta' => $lastPassDelta,
                'settled' => ScenarioLinkFixedPoint::isSettled($lastPassDelta, $solved['expectedValue']),
            ],
        ];
    }

    /**
     * The scenario's top-layer payoffs with every non-reference cell resolved for this viewer. Reference cells keep
     * only their axis costs in payoffs; their value comes from the iteration. Options whose resource requirements the
     * node's resources do not meet are left out, as the matrix editor does before solving.
     *
     * @param array<string, array<string, mixed>|null> $resourceContext
     *
     * @return ViewerNode
     */
    private function buildNode(
        Scenario $scenario,
        ?User $user,
        ?string $executionMode,
        ?int $difficultyCap,
        ?array $resourceContext,
        array $viewerContextPayload,
    ): array {
        $rows = $scenario->getRows()->toArray();
        usort($rows, static fn (ScenarioRow $a, ScenarioRow $b): int => $a->getPosition() <=> $b->getPosition());

        $columns = $scenario->getColumns()->toArray();
        usort($columns, static fn (ScenarioColumn $a, ScenarioColumn $b): int => $a->getPosition() <=> $b->getPosition());

        $maxLayer = $this->computeMaxLayer($rows, $columns);
        $visibleRowIndexes = $this->visibleIndexes($rows, $maxLayer, $resourceContext);
        $visibleColumnIndexes = $this->visibleIndexes($columns, $maxLayer, $resourceContext);
        $cellsByCoordinate = $this->buildCellCoordinateMap($scenario);
        $payoffs = [];
        $links = [];
        $references = [];

        foreach ($visibleRowIndexes as $rowIndex) {
            $rowCost = $this->axisResourceCostService->payoffAdjustment($rows[$rowIndex]);
            foreach ($visibleColumnIndexes as $columnIndex) {
                $cell = $cellsByCoordinate[$rowIndex][$columnIndex] ?? null;
                $costs = $rowCost + $this->axisResourceCostService->payoffAdjustment($columns[$columnIndex]);

                if ($cell instanceof ScenarioCell && ScenarioCell::KIND_REFERENCE === $cell->getKind()) {
                    $preValue = $this->resolveReferencePreValue($cell, $user, $executionMode, $difficultyCap, $resourceContext, $viewerContextPayload);
                    $id = spl_object_id($cell);
                    $references[] = [
                        'id' => $id,
                        'row' => $rowIndex,
                        'column' => $columnIndex,
                        'cell' => $cell,
                        'base' => $preValue['value'],
                        'resourceContext' => $preValue['resourceContext'],
                    ];
                    $links[$rowIndex][$columnIndex] = $id;
                    $payoffs[$rowIndex][$columnIndex] = $costs;
                    continue;
                }

                $payoffs[$rowIndex][$columnIndex] = $costs + $this->resolveCellValue($cell, $user, $executionMode, $difficultyCap, $resourceContext, $viewerContextPayload);
            }
        }

        return [
            'scenario' => $scenario,
            'rowCount' => count($rows),
            'columnCount' => count($columns),
            'rowKeys' => $this->buildAxisKeys($rows, $visibleRowIndexes, 'row'),
            'columnKeys' => $this->buildAxisKeys($columns, $visibleColumnIndexes, 'column'),
            'payoffs' => $payoffs,
            'links' => $links,
            'references' => $references,
        ];
    }

    /**
     * @param ViewerNode $node
     * @param array<int, float> $referenceValues
     *
     * @return array{expectedValue:float|null,rowAxis:list<float|null>,columnAxis:list<float|null>}
     */
    private function solveNode(array $node, array $referenceValues): array
    {
        $rowAxis = array_fill(0, $node['rowCount'], null);
        $columnAxis = array_fill(0, $node['columnCount'], null);
        if ([] === $node['rowKeys'] || [] === $node['columnKeys']) {
            return ['expectedValue' => null, 'rowAxis' => $rowAxis, 'columnAxis' => $columnAxis];
        }

        $payoffMatrix = [];
        foreach ($node['rowKeys'] as $rowIndex => $rowKey) {
            foreach ($node['columnKeys'] as $columnIndex => $columnKey) {
                $linkId = $node['links'][$rowIndex][$columnIndex] ?? null;
                $value = $node['payoffs'][$rowIndex][$columnIndex] + (null !== $linkId ? ($referenceValues[$linkId] ?? 0.0) : 0.0);
                $payoffMatrix[$rowKey][$columnKey] = (int) round($value);
            }
        }

        $result = $this->solveMemoized($payoffMatrix);
        $equilibrium = $result['equilibria'][0] ?? null;
        if (!is_array($equilibrium)) {
            return ['expectedValue' => null, 'rowAxis' => $rowAxis, 'columnAxis' => $columnAxis];
        }

        $expectedValue = 0.0;
        foreach ($node['rowKeys'] as $rowIndex => $rowKey) {
            $rowProbability = $this->toProbability($equilibrium['P1'][$rowKey] ?? null);
            $rowAxis[$rowIndex] = $rowProbability;
            foreach ($node['columnKeys'] as $columnKey) {
                $expectedValue += $payoffMatrix[$rowKey][$columnKey] * $rowProbability * $this->toProbability($equilibrium['P2'][$columnKey] ?? null);
            }
        }

        foreach ($node['columnKeys'] as $columnIndex => $columnKey) {
            $columnAxis[$columnIndex] = $this->toProbability($equilibrium['P2'][$columnKey] ?? null);
        }

        return ['expectedValue' => $expectedValue, 'rowAxis' => $rowAxis, 'columnAxis' => $columnAxis];
    }

    /**
     * @param array<string, array<string, mixed>|null> $resourceContext
     */
    private function resolveCellValue(
        ?ScenarioCell $cell,
        ?User $user,
        ?string $executionMode,
        ?int $difficultyCap,
        ?array $resourceContext,
        array $viewerContextPayload,
    ): float {
        if (!$cell instanceof ScenarioCell) {
            return 0.0;
        }

        if (ScenarioCell::KIND_DYNAMIC_COMBO === $cell->getKind()) {
            return $this->resolveDynamicComboValue($cell, $user, $executionMode, $difficultyCap, $resourceContext, $viewerContextPayload)['value'];
        }

        return null !== $cell->getStaticValue() ? (float) $cell->getStaticValue() : 0.0;
    }

    private function savedTopLayerExpectedValue(Scenario $scenario): float
    {
        $top = null;
        foreach ($scenario->getLayerSolutions() as $solution) {
            if (null === $top || $solution->getLayer() > $top->getLayer()) {
                $top = $solution;
            }
        }

        return $top?->getExpectedValue() ?? 0.0;
    }

    /**
     * @param array<string, array<string, mixed>|null>|null $resourceContext
     */
    private function nodeKey(Scenario $scenario, ?array $resourceContext): string
    {
        return $scenario->getPublicId()->toRfc4122() . '|' . (null === $resourceContext ? 'any' : md5(json_encode($resourceContext, JSON_THROW_ON_ERROR)));
    }

    /**
     * @param array<string, array<string, mixed>|null> $resourceContext
     *
     * @return array{value:float,resourceContext:array<string,mixed>|null}
     */
    private function resolveReferencePreValue(
        ScenarioCell $cell,
        ?User $user,
        ?string $executionMode,
        ?int $difficultyCap,
        ?array $resourceContext,
        array $viewerContextPayload,
    ): array {
        if ($cell->getStarterMoves()->count() > 0) {
            return $this->resolveDynamicComboValue($cell, $user, $executionMode, $difficultyCap, $resourceContext, $viewerContextPayload);
        }

        return [
            'value' => null !== $cell->getStaticValue() ? (float) $cell->getStaticValue() : 0.0,
            'resourceContext' => $resourceContext,
        ];
    }

    /**
     * @param array<string, array<string, mixed>|null> $resourceContext
     *
     * @return array{value:float,resourceContext:array<string,mixed>|null}
     */
    private function resolveDynamicComboValue(
        ScenarioCell $cell,
        ?User $user,
        ?string $executionMode,
        ?int $difficultyCap,
        ?array $resourceContext,
        array $viewerContextPayload,
    ): array {
        $scenario = $cell->getScenario();
        $attackerCharacterId = $scenario?->getAttackerCharacter()?->getId()?->toRfc4122();
        $defenderCharacterId = $scenario?->getDefenderCharacter()?->getId()?->toRfc4122();
        if (null === $attackerCharacterId || null === $defenderCharacterId) {
            return ['value' => 0.0, 'resourceContext' => $resourceContext];
        }

        $starterMoveIds = [];
        foreach ($cell->getStarterMoves() as $starterMove) {
            $starterMoveId = $starterMove->getId()?->toRfc4122();
            if (null !== $starterMoveId && '' !== $starterMoveId) {
                $starterMoveIds[] = $starterMoveId;
            }
        }

        if ([] === $starterMoveIds) {
            return ['value' => 0.0, 'resourceContext' => $resourceContext];
        }

        $isAttackerInitiated = $cell->isComboInitiatorAttacker();
        $initiatorRole = $isAttackerInitiated ? 'attacker' : 'defender';
        $initiatorContext = null !== $resourceContext ? ($resourceContext[$initiatorRole] ?? null) : null;
        $memoKey = md5(serialize([$cell->getId() ?? 'unsaved-' . spl_object_id($cell), $user?->getId(), $executionMode, $difficultyCap, $initiatorContext, $viewerContextPayload]));
        if (count($this->comboMemo) >= self::MEMO_LIMIT) {
            $this->comboMemo = [];
        }
        $resolution = $this->comboMemo[$memoKey] ??= $this->resolveDynamicComboCellService->resolve(
            $isAttackerInitiated ? $attackerCharacterId : $defenderCharacterId,
            $starterMoveIds,
            $this->toHitType($cell->getStarterContext()),
            $user,
            $executionMode,
            $difficultyCap,
            is_array($initiatorContext) ? $initiatorContext : null,
            $this->scenarioComboContextService->buildEffectiveContext($scenario, $viewerContextPayload),
        );

        $nextResourceContext = $resourceContext;
        if (null !== $nextResourceContext && is_array($resolution['resourceContext'] ?? null)) {
            $nextResourceContext[$initiatorRole] = $resolution['resourceContext'];
        }

        return [
            'value' => is_numeric($resolution['resolvedDamage']) ? (float) $resolution['resolvedDamage'] : 0.0,
            'resourceContext' => $nextResourceContext,
        ];
    }

    /**
     * @return array<int, array<int, ScenarioCell>>
     */
    private function buildCellCoordinateMap(Scenario $scenario): array
    {
        $cellsByCoordinate = [];
        foreach ($scenario->getCells() as $cell) {
            $rowPosition = $cell->getRow()?->getPosition();
            $columnPosition = $cell->getColumn()?->getPosition();
            if (null === $rowPosition || null === $columnPosition) {
                continue;
            }
            $cellsByCoordinate[$rowPosition][$columnPosition] = $cell;
        }

        return $cellsByCoordinate;
    }

    /**
     * Two requests with the same nodes, payoffs and links solve to the same result, whatever resources led there. Node
     * keys carry the resources, so they are replaced by their order of discovery, which is deterministic.
     *
     * @param array<string, ViewerNode>                 $nodes
     * @param array<string, list<FixedPointLink>>       $linksByNode
     */
    private function fingerprint(array $nodes, array $linksByNode, string $seedKey, ?int $passes): string
    {
        $order = array_flip(array_keys($nodes));
        $canonical = [$order[$seedKey], $passes];
        foreach ($nodes as $key => $node) {
            $links = array_map(static fn (array $link): array => [
                $link['id'],
                $link['base'],
                $link['factor'],
                null === $link['target'] ? null : $order[$link['target']],
                $link['initial'],
                $link['fallback'],
            ], $linksByNode[$key]);
            $canonical[] = [$node['scenario']->getPublicId()->toRfc4122(), $node['rowKeys'], $node['columnKeys'], $node['payoffs'], $node['links'], $links];
        }

        return md5(serialize($canonical));
    }

    /**
     * @param array<string, array<string, int>> $payoffMatrix
     *
     * @return array<string, mixed>
     */
    private function solveMemoized(array $payoffMatrix): array
    {
        $key = md5(serialize($payoffMatrix));
        if (!isset($this->solveMemo[$key])) {
            if (count($this->solveMemo) >= self::MEMO_LIMIT) {
                $this->solveMemo = [];
            }
            $this->solveMemo[$key] = $this->mixedStrategyGameSolver->solveMixedStrategyGame($payoffMatrix);
        }

        return $this->solveMemo[$key];
    }

    /**
     * @param list<ScenarioRow|ScenarioColumn>         $items
     * @param array<string, array<string, mixed>|null>|null $resourceContext
     *
     * @return list<int>
     */
    private function visibleIndexes(array $items, int $layer, ?array $resourceContext = null): array
    {
        $indexes = [];
        foreach ($items as $index => $item) {
            if ($item->getLayer() <= $layer && (null === $resourceContext || $this->meetsRequirements($item, $resourceContext))) {
                $indexes[] = $index;
            }
        }

        return $indexes;
    }

    /**
     * @param array<string, array<string, mixed>|null> $resourceContext
     */
    private function meetsRequirements(ScenarioRow|ScenarioColumn $item, array $resourceContext): bool
    {
        foreach ($item->getResourceRequirements() as $requirement) {
            $available = $resourceContext[$requirement->getResourceOwner()][$requirement->getResourceType()] ?? null;
            if (is_numeric($available) && (float) $available < $requirement->getThresholdValue()) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param list<ScenarioRow|ScenarioColumn> $items
     * @param list<int>                       $indexes
     *
     * @return array<int, string>
     */
    private function buildAxisKeys(array $items, array $indexes, string $prefix): array
    {
        $keys = [];
        foreach ($indexes as $index) {
            $label = trim((string) $items[$index]->getLabel());
            $keys[$index] = '' !== $label ? $label : sprintf('%s_%d', $prefix, $index + 1);
        }

        return $keys;
    }

    /**
     * @param list<ScenarioRow>    $rows
     * @param list<ScenarioColumn> $columns
     */
    private function computeMaxLayer(array $rows, array $columns): int
    {
        $max = 1;
        foreach ($rows as $row) {
            $max = max($max, $row->getLayer());
        }
        foreach ($columns as $column) {
            $max = max($max, $column->getLayer());
        }

        return $max;
    }

    private function toHitType(?string $starterContext): string
    {
        if ('perfect_parry' === $starterContext) {
            return 'perfect_parry';
        }

        if ('punish_counter' === $starterContext) {
            return 'punish_counter';
        }

        if ('counter_hit' === $starterContext) {
            return 'counter_hit';
        }

        return 'normal';
    }

    private function toProbability(mixed $value): float
    {
        return is_numeric($value) ? (float) $value : 0.0;
    }
}
