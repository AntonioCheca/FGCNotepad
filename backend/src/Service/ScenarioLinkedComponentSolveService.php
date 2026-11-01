<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Scenario;
use App\Entity\ScenarioCell;
use App\Repository\ScenarioRepository;

/**
 * Solves the scenarios connected by reference cells (their linked component) together, so self-links and cycles get a
 * value. A reference cell is worth preValue + factor × (linked scenario's top-layer EV), where the factor is the weight,
 * negated for an opponent-side link; its cachedValue stores that total and the layer solver reads it.
 *
 * @phpstan-import-type FixedPointLink from ScenarioLinkFixedPoint
 *
 * @phpstan-type ComponentSolution array{passes:int,referenceValues:array<int,float>,scenarios:list<array{scenario:Scenario,expectedValue:float|null,lastPassDelta:float|null}>}
 * @phpstan-type ConvergenceReport array{passes:int,scenarios:list<array{id:string,name:string,expectedValue:float|null,lastPassDelta:float|null,settled:bool}>,warnings:list<string>}
 */
class ScenarioLinkedComponentSolveService
{
    public function __construct(
        private readonly ScenarioRepository $scenarioRepository,
        private readonly ScenarioLayerSolveService $scenarioLayerSolveService,
        private readonly ScenarioSavedSolutionService $scenarioSavedSolutionService,
        private readonly ResolveScenarioDynamicComboCellsService $resolveScenarioDynamicComboCellsService,
        private readonly ScenarioComboContextService $scenarioComboContextService,
    ) {
    }

    /**
     * Every scenario reachable from the seeds through reference links in either direction.
     *
     * @param list<Scenario> $seeds
     *
     * @return list<Scenario>
     */
    public function findComponent(array $seeds): array
    {
        $component = [];
        $queue = $seeds;
        while ([] !== $queue) {
            $added = [];
            foreach ($queue as $scenario) {
                if (!isset($component[spl_object_id($scenario)])) {
                    $component[spl_object_id($scenario)] = $scenario;
                    $added[] = $scenario;
                }
            }

            $queue = [];
            foreach ($added as $scenario) {
                foreach ($scenario->getCells() as $cell) {
                    $linked = $cell->getReferenceScenario();
                    if (null !== $linked && !isset($component[spl_object_id($linked)])) {
                        $queue[] = $linked;
                    }
                }
            }

            $addedIds = array_values(array_filter(array_map(static fn (Scenario $scenario): ?int => $scenario->getId(), $added)));
            foreach ($this->scenarioRepository->findLinkingTo($addedIds) as $linking) {
                if (!isset($component[spl_object_id($linking)])) {
                    $queue[] = $linking;
                }
            }
        }

        return array_values($component);
    }

    /**
     * Solves a linked component without writing anything. A component without reference cells needs no passes.
     *
     * @param list<Scenario> $component
     *
     * @return ComponentSolution
     */
    public function solve(array $component, ?int $passes = null): array
    {
        $linksByNode = [];
        $scenariosByNode = [];
        $hasLinks = false;
        foreach ($component as $scenario) {
            $node = $this->nodeKey($scenario);
            $scenariosByNode[$node] = $scenario;
            $linksByNode[$node] = $this->buildLinks($scenario);
            $hasLinks = $hasLinks || [] !== $linksByNode[$node];
        }

        if (!$hasLinks) {
            return ['passes' => 0, 'referenceValues' => [], 'scenarios' => []];
        }

        $solution = ScenarioLinkFixedPoint::iterate(
            $linksByNode,
            fn (string $node, array $values): ?float => $this->topLayerExpectedValue($scenariosByNode[$node], $values),
            ScenarioLinkFixedPoint::clampPasses($passes),
        );

        $scenarios = [];
        foreach ($scenariosByNode as $node => $scenario) {
            $scenarios[] = [
                'scenario' => $scenario,
                'expectedValue' => $solution['expectedValues'][$node],
                'lastPassDelta' => $solution['lastPassDeltas'][$node],
            ];
        }

        return [
            'passes' => $solution['passes'],
            'referenceValues' => array_map(static fn (float $value): float => round($value, 2), $solution['values']),
            'scenarios' => $scenarios,
        ];
    }

    /**
     * Solves the seeds' linked component and stores the result: each reference cell's cachedValue and every
     * component scenario's saved layer solutions.
     *
     * @param list<Scenario> $seeds
     *
     * @return ConvergenceReport
     */
    public function solveAndStore(array $seeds, ?int $passes = null): array
    {
        $component = $this->findComponent($seeds);
        $solution = $this->solve($component, $passes);
        foreach ($component as $scenario) {
            foreach ($scenario->getCells() as $cell) {
                $value = $solution['referenceValues'][spl_object_id($cell)] ?? null;
                if (null !== $value) {
                    $cell->setCachedValue($value);
                }
            }
            $this->scenarioSavedSolutionService->refresh($scenario);
        }

        return $this->report($solution);
    }

    /**
     * The layers of one scenario solved with its component's current links, without writing anything.
     *
     * @return array{maxLayer:int,layers:array<int, array{rowAxis:list<float|null>,columnAxis:list<float|null>,expectedValue:float|null}>,convergence:ConvergenceReport}
     */
    public function solveLayers(Scenario $scenario, string $executionMode, ?int $difficultyCap, ?int $passes = null): array
    {
        $solution = $this->solve($this->findComponent([$scenario]), $passes);
        $layers = 0 === $solution['passes']
            ? $this->scenarioLayerSolveService->solveByLayer($scenario, $executionMode, $difficultyCap)
            : $this->scenarioLayerSolveService->solveByLayerWithReferenceValues($scenario, $solution['referenceValues']);

        return $layers + ['convergence' => $this->report($solution)];
    }

    /**
     * @param ComponentSolution $solution
     *
     * @return ConvergenceReport
     */
    public function report(array $solution): array
    {
        $scenarios = [];
        $warnings = [];
        foreach ($solution['scenarios'] as $entry) {
            $settled = ScenarioLinkFixedPoint::isSettled($entry['lastPassDelta'], $entry['expectedValue']);
            $scenarios[] = [
                'id' => $entry['scenario']->getPublicId()->toRfc4122(),
                'name' => (string) $entry['scenario']->getName(),
                'expectedValue' => $entry['expectedValue'],
                'lastPassDelta' => $entry['lastPassDelta'],
                'settled' => $settled,
            ];
            if (!$settled) {
                $warnings[] = sprintf(
                    '%s: EV still moved by %+.1f on the last of %d linked-scenario passes.',
                    $entry['scenario']->getName(),
                    $entry['lastPassDelta'],
                    $solution['passes']
                );
            }
        }

        return ['passes' => $solution['passes'], 'scenarios' => $scenarios, 'warnings' => $warnings];
    }

    /**
     * @return list<FixedPointLink>
     */
    private function buildLinks(Scenario $scenario): array
    {
        $links = [];
        $comboContext = null;
        foreach ($scenario->getCells() as $cell) {
            if (ScenarioCell::KIND_REFERENCE !== $cell->getKind()) {
                continue;
            }

            if ($cell->getStarterMoves()->isEmpty()) {
                $base = $cell->getStaticValue() ?? 0.0;
            } else {
                $comboContext ??= $this->scenarioComboContextService->buildEffectiveContext($scenario, []);
                $base = $this->resolveScenarioDynamicComboCellsService->resolveStarterDamage($cell, $comboContext) ?? 0.0;
            }

            $linked = $cell->getReferenceScenario();
            $links[] = [
                'id' => spl_object_id($cell),
                'base' => $base,
                'factor' => $cell->getReferenceFactor(),
                'target' => null !== $linked ? $this->nodeKey($linked) : null,
                'initial' => $cell->getCachedValue() ?? $base,
                'fallback' => 0.0,
            ];
        }

        return $links;
    }

    /**
     * @param array<int, float> $referenceValues
     */
    private function topLayerExpectedValue(Scenario $scenario, array $referenceValues): ?float
    {
        $solved = $this->scenarioLayerSolveService->solveByLayerWithReferenceValues($scenario, $referenceValues, true);

        return $solved['layers'][$solved['maxLayer']]['expectedValue'] ?? null;
    }

    private function nodeKey(Scenario $scenario): string
    {
        return 'scenario-' . spl_object_id($scenario);
    }
}
