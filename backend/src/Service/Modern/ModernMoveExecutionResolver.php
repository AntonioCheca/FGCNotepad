<?php declare(strict_types=1);

namespace App\Service\Modern;

use App\Entity\Move;
use App\Util\Enum\ComboExecutionMode;

/**
 * Chooses how a move is performed in an execution mode. Notation and damage both come from this one choice, so the
 * notation shown for a mode always matches the damage calculated for it.
 */
final class ModernMoveExecutionResolver
{
    public function resolve(Move $move, ComboExecutionMode $mode): MoveExecution
    {
        $motion = $this->nonEmpty($move->getModernMaxNotation());
        $simple = $this->nonEmpty($move->getModernSimpleNotation());

        return match ($mode) {
            ComboExecutionMode::CLASSIC => $this->motion($move->getNumpadNotation()),
            ComboExecutionMode::MODERN_MAX => null !== $motion ? $this->motion($motion) : (null !== $simple ? $this->simple($simple, $move) : $this->motion($move->getNumpadNotation())),
            ComboExecutionMode::MODERN_SIMPLE => null !== $simple ? $this->simple($simple, $move) : $this->motion($motion ?? $move->getNumpadNotation()),
        };
    }

    private function motion(string $notation): MoveExecution
    {
        return new MoveExecution($notation, false, null);
    }

    private function simple(string $notation, Move $move): MoveExecution
    {
        return new MoveExecution($notation, true, $move->getModernSimpleDamagePercent());
    }

    private function nonEmpty(?string $value): ?string
    {
        return null === $value || '' === trim($value) ? null : trim($value);
    }
}
