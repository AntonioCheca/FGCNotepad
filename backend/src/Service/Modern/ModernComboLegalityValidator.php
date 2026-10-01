<?php declare(strict_types=1);

namespace App\Service\Modern;

use App\Entity\Move;

/**
 * A combo is Modern legal when every move is either directly available on Modern or reached through an auto combo:
 * the move sits at position k of an auto combo and the k moves right before it in the combo are that auto combo's
 * first k moves.
 */
final class ModernComboLegalityValidator
{
    /**
     * @param list<Move> $moves
     * @param list<list<Move>> $autoCombos
     */
    public function isLegal(array $moves, array $autoCombos): bool
    {
        foreach ($moves as $index => $move) {
            if (!$move->isAvailableOnModern() && !$this->reachableThroughAutoCombo($moves, $index, $autoCombos)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param list<Move> $moves
     * @param list<list<Move>> $autoCombos
     */
    private function reachableThroughAutoCombo(array $moves, int $index, array $autoCombos): bool
    {
        foreach ($autoCombos as $autoCombo) {
            foreach ($autoCombo as $position => $autoComboMove) {
                if ($position > 0 && $autoComboMove === $moves[$index] && $this->prefixPrecedes($moves, $index, $autoCombo, $position)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * @param list<Move> $moves
     * @param list<Move> $autoCombo
     */
    private function prefixPrecedes(array $moves, int $index, array $autoCombo, int $position): bool
    {
        if ($index < $position) {
            return false;
        }

        for ($offset = 0; $offset < $position; ++$offset) {
            if ($moves[$index - $position + $offset] !== $autoCombo[$offset]) {
                return false;
            }
        }

        return true;
    }
}
