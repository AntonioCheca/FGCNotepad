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
    private const CANCEL_CONNECTIONS = ['special', 'super cancel'];
    private const WALK_CONNECTIONS = ['walk forward' => 'walk', 'walk back' => 'walk back'];
    private const RAW_DRIVE_RUSH_NOTATION = 'DR';

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
        $notation = '';
        $previous = null;
        foreach ($moves as ['move' => $move, 'connectionTypeName' => $connectionTypeName]) {
            $stepNotation = $this->stepNotation($move, $mode);
            $notation .= null === $previous ? $stepNotation : $this->separator($connectionTypeName, $previous) . $stepNotation;
            $previous = $move;
        }

        return '' === $notation ? null : $notation;
    }

    /** Raw Drive Rush reads as one action with the move it runs into: "DR 6MP", not "DR, 6MP". */
    private function separator(?string $connectionTypeName, Move $previous): string
    {
        $connection = mb_strtolower(trim((string) $connectionTypeName));

        return match (true) {
            in_array($connection, self::DRIVE_RUSH_CANCEL_CONNECTIONS, true) => ' DRC ',
            in_array($connection, self::CANCEL_CONNECTIONS, true) => ' xx ',
            isset(self::WALK_CONNECTIONS[$connection]) => ', ' . self::WALK_CONNECTIONS[$connection] . ', ',
            self::RAW_DRIVE_RUSH_NOTATION === $previous->getNumpadNotation() => ' ',
            default => ', ',
        };
    }
}
