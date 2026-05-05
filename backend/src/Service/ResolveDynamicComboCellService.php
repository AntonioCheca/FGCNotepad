<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\User;
use App\Repository\ComboSequencesRepository;
use App\Repository\MoveRepository;

class ResolveDynamicComboCellService
{
    public function __construct(
        private readonly ComboSequencesRepository $comboSequencesRepository,
        private readonly MoveRepository $moveRepository,
        private readonly ScenarioExecutionModeService $scenarioExecutionModeService,
    ) {
    }

    /**
     * @param list<string> $starterMoveIds
     *
     * @return array{resolvedDamage:float|null,resolvedComboId:int|null,resolvedStarterMoveId:string|null}
     */
    public function resolve(
        string $attackerCharacterId,
        array $starterMoveIds,
        string $hitType,
        ?User $user = null,
        ?string $executionMode = null,
        ?int $difficultyCap = null,
    ): array
    {
        $normalizedStarterMoveIds = array_values(array_filter(
            $starterMoveIds,
            static fn (string $starterMoveId): bool => '' !== trim($starterMoveId)
        ));

        if ([] === $normalizedStarterMoveIds || '' === trim($attackerCharacterId)) {
            return [
                'resolvedDamage' => null,
                'resolvedComboId' => null,
                'resolvedStarterMoveId' => null,
            ];
        }

        $filter = $this->scenarioExecutionModeService->resolveComboFilter(
            $user,
            trim($attackerCharacterId),
            $executionMode,
            $difficultyCap
        );

        $normalizedHitType = $this->normalizeHitType($hitType);

        $comboMatch = $this->comboSequencesRepository->findBestDynamicComboMatchWithExecutionFilter(
            trim($attackerCharacterId),
            $normalizedStarterMoveIds,
            $normalizedHitType,
            $filter['allowedComboIds'],
            $filter['maxDifficulty'],
            $filter['includeUnratedDifficulty']
        );

        return $this->buildResolutionFromComboMatch(
            trim($attackerCharacterId),
            $normalizedStarterMoveIds,
            $comboMatch
        );
    }

    /**
     * @param list<string> $starterMoveIds
     * @param list<int>|null $allowedComboIds
     *
     * @return array{resolvedDamage:float|null,resolvedComboId:int|null,resolvedStarterMoveId:string|null}
     */
    public function resolveWithComboFilter(
        string $attackerCharacterId,
        array $starterMoveIds,
        string $hitType,
        ?array $allowedComboIds,
        ?int $maxDifficulty,
        bool $includeUnratedDifficulty
    ): array {
        $normalizedStarterMoveIds = array_values(array_filter(
            $starterMoveIds,
            static fn (string $starterMoveId): bool => '' !== trim($starterMoveId)
        ));

        if ([] === $normalizedStarterMoveIds || '' === trim($attackerCharacterId)) {
            return [
                'resolvedDamage' => null,
                'resolvedComboId' => null,
                'resolvedStarterMoveId' => null,
            ];
        }

        $normalizedHitType = $this->normalizeHitType($hitType);

        $comboMatch = $this->comboSequencesRepository->findBestDynamicComboMatchWithExecutionFilter(
            trim($attackerCharacterId),
            $normalizedStarterMoveIds,
            $normalizedHitType,
            $allowedComboIds,
            $maxDifficulty,
            $includeUnratedDifficulty
        );

        return $this->buildResolutionFromComboMatch(
            trim($attackerCharacterId),
            $normalizedStarterMoveIds,
            $comboMatch
        );
    }

    /**
     * @param list<string> $starterMoveIds
     * @param array{combo_id:int,resolved_damage:int,starter_move_id:string}|null $comboMatch
     *
     * @return array{resolvedDamage:float|null,resolvedComboId:int|null,resolvedStarterMoveId:string|null}
     */
    private function buildResolutionFromComboMatch(
        string $attackerCharacterId,
        array $starterMoveIds,
        ?array $comboMatch
    ): array {
        if (null !== $comboMatch) {
            return [
                'resolvedDamage' => (float) $comboMatch['resolved_damage'],
                'resolvedComboId' => $comboMatch['combo_id'],
                'resolvedStarterMoveId' => $comboMatch['starter_move_id'],
            ];
        }

        $starterMoveFallback = $this->findStarterMoveFallbackDamage($attackerCharacterId, $starterMoveIds);
        if (null === $starterMoveFallback) {
            return [
                'resolvedDamage' => null,
                'resolvedComboId' => null,
                'resolvedStarterMoveId' => null,
            ];
        }

        return [
            'resolvedDamage' => (float) $starterMoveFallback['damage'],
            'resolvedComboId' => null,
            'resolvedStarterMoveId' => $starterMoveFallback['move_id'],
        ];
    }

    private function normalizeHitType(string $hitType): string
    {
        $normalized = trim(mb_strtolower($hitType));

        return in_array($normalized, ['normal', 'counter_hit', 'punish_counter'], true)
            ? $normalized
            : 'normal';
    }

    /**
     * @param list<string> $starterMoveIds
     *
     * @return array{move_id:string,damage:int}|null
     */
    private function findStarterMoveFallbackDamage(string $attackerCharacterId, array $starterMoveIds): ?array
    {
        $damages = $this->moveRepository->findMoveDamagesByCharacterAndIds($attackerCharacterId, $starterMoveIds);
        if ([] === $damages) {
            return null;
        }

        usort(
            $damages,
            static function (array $left, array $right): int {
                $damageSort = $right['damage'] <=> $left['damage'];
                if (0 !== $damageSort) {
                    return $damageSort;
                }

                return strcmp($left['move_id'], $right['move_id']);
            }
        );

        return $damages[0];
    }
}
