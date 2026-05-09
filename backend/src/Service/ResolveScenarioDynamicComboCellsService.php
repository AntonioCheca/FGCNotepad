<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Scenario;
use App\Entity\ScenarioCell;
use App\Entity\User;

class ResolveScenarioDynamicComboCellsService
{
    public function __construct(
        private readonly ResolveDynamicComboCellService $resolveDynamicComboCellService,
    ) {
    }

    /**
     * @param array{allowedPositions:list<string>,characterStatuses:array<string,string>}|null $comboContext
     *
     * @return array{totalDynamicCells:int,resolvedCells:int,unresolvedCells:int}
     */
    public function resolveForScenario(
        Scenario $scenario,
        ?User $user = null,
        ?string $executionMode = null,
        ?int $difficultyCap = null,
        ?array $resourceContext = null,
        ?array $comboContext = null,
    ): array
    {
        $attackerCharacterId = $scenario->getAttackerCharacter()?->getId()?->toRfc4122();
        $defenderCharacterId = $scenario->getDefenderCharacter()?->getId()?->toRfc4122();
        if (null === $attackerCharacterId || '' === $attackerCharacterId || null === $defenderCharacterId || '' === $defenderCharacterId) {
            return [
                'totalDynamicCells' => 0,
                'resolvedCells' => 0,
                'unresolvedCells' => 0,
            ];
        }

        $totalDynamicCells = 0;
        $resolvedCells = 0;
        $unresolvedCells = 0;

        foreach ($scenario->getCells() as $cell) {
            if (ScenarioCell::KIND_DYNAMIC_COMBO !== $cell->getKind()) {
                continue;
            }

            ++$totalDynamicCells;

            $starterMoveIds = [];
            foreach ($cell->getStarterMoves() as $starterMove) {
                $starterMoveId = $starterMove->getId()?->toRfc4122();
                if (null !== $starterMoveId && '' !== $starterMoveId) {
                    $starterMoveIds[] = $starterMoveId;
                }
            }

            $hitType = $this->toHitType($cell->getStarterContext());
            $isAttackerInitiated = $cell->isComboInitiatorAttacker();
            $resolution = $this->resolveDynamicComboCellService->resolve(
                $isAttackerInitiated ? $attackerCharacterId : $defenderCharacterId,
                $starterMoveIds,
                $hitType,
                $user,
                $executionMode,
                $difficultyCap,
                null !== $resourceContext ? $resourceContext[$isAttackerInitiated ? 'attacker' : 'defender'] : null,
                $comboContext
            );

            $cell->setCachedValue($resolution['resolvedDamage']);

            if (null === $resolution['resolvedDamage']) {
                ++$unresolvedCells;
            } else {
                ++$resolvedCells;
            }
        }

        return [
            'totalDynamicCells' => $totalDynamicCells,
            'resolvedCells' => $resolvedCells,
            'unresolvedCells' => $unresolvedCells,
        ];
    }

    private function toHitType(?string $starterContext): string
    {
        if ('punish_counter' === $starterContext) {
            return 'punish_counter';
        }

        if ('counter_hit' === $starterContext) {
            return 'counter_hit';
        }

        return 'normal';
    }
}
