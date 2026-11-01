<?php declare(strict_types=1);

namespace App\Service;

/**
 * Fixed-point iteration over scenarios linked by reference cells, which may link to themselves or form cycles.
 *
 * Pass 0 solves every node with each reference at its initial value. Pass n sets each reference to
 * base + factor × (linked node's EV from pass n-1) and solves every node again. It always stops after the given number
 * of passes: links are never followed depth-first, so a cycle cannot loop.
 *
 * @phpstan-type FixedPointLink array{id:int,base:float,factor:float,target:string|null,initial:float,fallback:float}
 */
final class ScenarioLinkFixedPoint
{
    public const DEFAULT_PASSES = 3;
    public const MAX_PASSES = 5;

    /** A last-pass EV change above either threshold means the links have not settled. */
    private const UNSETTLED_ABSOLUTE_DELTA = 25.0;
    private const UNSETTLED_RELATIVE_DELTA = 0.05;
    /** Below this, a change is rounding noise from the integer payoffs, whatever the EV. */
    private const NOISE_DELTA = 1.0;

    public static function clampPasses(?int $passes): int
    {
        return max(1, min(self::MAX_PASSES, $passes ?? self::DEFAULT_PASSES));
    }

    /**
     * @param array<string, list<FixedPointLink>> $linksByNode every node to solve, with its reference cells; a link
     *                                                         whose target is not a node uses its fallback EV
     * @param \Closure(string, array<int, float>): (float|null) $solve the node's top-layer EV given reference values by link id
     *
     * @return array{passes:int,values:array<int,float>,linkedExpectedValues:array<int,float>,expectedValues:array<string,float|null>,lastPassDeltas:array<string,float|null>}
     */
    public static function iterate(array $linksByNode, \Closure $solve, int $passes): array
    {
        $values = [];
        $linkedExpectedValues = [];
        foreach ($linksByNode as $links) {
            foreach ($links as $link) {
                $values[$link['id']] = $link['initial'];
            }
        }

        $expectedValues = self::solveAll($linksByNode, $solve, $values);
        $previous = $expectedValues;
        for ($pass = 1; $pass <= $passes; ++$pass) {
            foreach ($linksByNode as $links) {
                foreach ($links as $link) {
                    $linked = null !== $link['target'] && array_key_exists($link['target'], $expectedValues)
                        ? ($expectedValues[$link['target']] ?? 0.0)
                        : $link['fallback'];
                    $linkedExpectedValues[$link['id']] = $linked;
                    $values[$link['id']] = $link['base'] + $link['factor'] * $linked;
                }
            }

            $previous = $expectedValues;
            $expectedValues = self::solveAll($linksByNode, $solve, $values);
        }

        $lastPassDeltas = [];
        foreach ($expectedValues as $node => $expectedValue) {
            $lastPassDeltas[$node] = null !== $expectedValue && null !== $previous[$node] ? $expectedValue - $previous[$node] : null;
        }

        return [
            'passes' => $passes,
            'values' => $values,
            'linkedExpectedValues' => $linkedExpectedValues,
            'expectedValues' => $expectedValues,
            'lastPassDeltas' => $lastPassDeltas,
        ];
    }

    public static function isSettled(?float $lastPassDelta, ?float $expectedValue): bool
    {
        if (null === $lastPassDelta) {
            return true;
        }

        $delta = abs($lastPassDelta);

        return $delta <= self::NOISE_DELTA
            || ($delta <= self::UNSETTLED_ABSOLUTE_DELTA && $delta <= self::UNSETTLED_RELATIVE_DELTA * abs($expectedValue ?? 0.0));
    }

    /**
     * @param array<string, list<FixedPointLink>> $linksByNode
     * @param \Closure(string, array<int, float>): (float|null) $solve
     * @param array<int, float> $values
     *
     * @return array<string, float|null>
     */
    private static function solveAll(array $linksByNode, \Closure $solve, array $values): array
    {
        $expectedValues = [];
        foreach (array_keys($linksByNode) as $node) {
            $expectedValues[$node] = $solve((string) $node, $values);
        }

        return $expectedValues;
    }
}
