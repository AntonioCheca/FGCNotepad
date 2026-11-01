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

            $resolution = $this->resolveCell($cell, $attackerCharacterId, $defenderCharacterId, $user, $executionMode, $difficultyCap, $resourceContext, $comboContext);

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

    /**
     * Standard-mode damage of a cell's starter combo, such as a reference cell's dynamic preValue; null when it has
     * no starter or no combo resolves.
     *
     * @param array{allowedPositions:list<string>,characterStatuses:array<string,string>}|null $comboContext
     */
    public function resolveStarterDamage(ScenarioCell $cell, ?array $comboContext): ?float
    {
        $scenario = $cell->getScenario();
        $attackerCharacterId = $scenario?->getAttackerCharacter()?->getId()?->toRfc4122();
        $defenderCharacterId = $scenario?->getDefenderCharacter()?->getId()?->toRfc4122();
        if (null === $attackerCharacterId || null === $defenderCharacterId || $cell->getStarterMoves()->isEmpty()) {
            return null;
        }

        $damage = $this->resolveCell($cell, $attackerCharacterId, $defenderCharacterId, null, ScenarioExecutionModeService::MODE_STANDARD, null, null, $comboContext)['resolvedDamage'];

        return is_numeric($damage) ? (float) $damage : null;
    }

    /**
     * @param array<string, array<string, mixed>|null>|null $resourceContext
     * @param array{allowedPositions:list<string>,characterStatuses:array<string,string>}|null $comboContext
     *
     * @return array<string, mixed>
     */
    private function resolveCell(
        ScenarioCell $cell,
        string $attackerCharacterId,
        string $defenderCharacterId,
        ?User $user,
        ?string $executionMode,
        ?int $difficultyCap,
        ?array $resourceContext,
        ?array $comboContext,
    ): array {
        $starterMoveIds = [];
        foreach ($cell->getStarterMoves() as $starterMove) {
            $starterMoveId = $starterMove->getId()?->toRfc4122();
            if (null !== $starterMoveId && '' !== $starterMoveId) {
                $starterMoveIds[] = $starterMoveId;
            }
        }

        $hitType = $this->toHitType($cell->getStarterContext());
        $isAttackerInitiated = $cell->isComboInitiatorAttacker();

        return $this->resolveDynamicComboCellService->resolve(
            $isAttackerInitiated ? $attackerCharacterId : $defenderCharacterId,
            $starterMoveIds,
            $hitType,
            $user,
            $executionMode,
            $difficultyCap,
            null !== $resourceContext ? $resourceContext[$isAttackerInitiated ? 'attacker' : 'defender'] : null,
            $comboContext
        );
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
}
