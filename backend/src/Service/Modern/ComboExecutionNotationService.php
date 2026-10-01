<?php declare(strict_types=1);

namespace App\Service\Modern;

use App\Entity\ComboSequences;
use App\Entity\Move;
use App\Entity\Step;
use App\Util\Enum\ComboExecutionMode;

/** Writes a combo's move sequence in the notation of an execution mode. */
final class ComboExecutionNotationService
{
    private const DRIVE_RUSH_CANCEL_CONNECTIONS = ['dr cancel', 'drive rush cancel', 'drc'];

    public function __construct(private readonly ModernMoveExecutionResolver $executionResolver)
    {
    }

    public function stepNotation(Move $move, ComboExecutionMode $mode): string
    {
        return $this->executionResolver->resolve($move, $mode)->notation;
    }

    public function comboNotation(ComboSequences $sequence, ComboExecutionMode $mode): ?string
    {
        $steps = $sequence->getSteps()->toArray();
        usort($steps, static fn (Step $left, Step $right): int => ($left->getOrdinalInCombo() ?? 0) <=> ($right->getOrdinalInCombo() ?? 0));

        $moves = [];
        foreach ($steps as $step) {
            $move = $step->getChildSequence()?->getMove();
            if ($move instanceof Move) {
                $moves[] = ['move' => $move, 'connectionTypeName' => $step->getConnectionType()?->getName()];
            }
        }

        return $this->sequenceNotation($moves, $mode);
    }

    /** @param list<array{move: Move, connectionTypeName: string|null}> $moves */
    public function sequenceNotation(array $moves, ComboExecutionMode $mode): ?string
    {
        $parts = [];
        foreach ($moves as ['move' => $move, 'connectionTypeName' => $connectionTypeName]) {
            if (in_array(mb_strtolower(trim((string) $connectionTypeName)), self::DRIVE_RUSH_CANCEL_CONNECTIONS, true)) {
                $parts[] = '[DRC]';
            }
            $parts[] = $this->stepNotation($move, $mode);
        }

        return [] === $parts ? null : implode(' > ', $parts);
    }
}
