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
        private readonly ComboValueEstimator $comboValueEstimator,
    ) {
    }

    /**
     * @param list<string> $starterMoveIds
     * @param array{health?:float,drive?:float,super?:float,objectStatuses?:array<string,string|int|float|bool>}|null $availableResources
     * @param array{allowedPositions:list<string>,characterStatuses:array<string,string>}|null $comboContext
     *
     * @return array{resolvedDamage:float|null,resolvedComboId:int|null,resolvedStarterMoveId:string|null,resourceContext:array<string,mixed>|null}
     */
    public function resolve(
        string $attackerCharacterId,
        array $starterMoveIds,
        string $hitType,
        ?User $user = null,
        ?string $executionMode = null,
        ?int $difficultyCap = null,
        ?array $availableResources = null,
        ?array $comboContext = null,
    ): array
    {
        $normalizedStarterMoveIds = array_values(array_filter(
            $starterMoveIds,
            static fn (string $starterMoveId): bool => '' !== trim($starterMoveId)
        ));

        if ([] === $normalizedStarterMoveIds || '' === trim($attackerCharacterId)) {
            return $this->emptyResolution();
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
            $filter['includeUnratedDifficulty'],
            $availableResources['drive'] ?? null,
            $availableResources['super'] ?? null,
            $this->mergeAvailableObjectStatuses($comboContext, $availableResources)
        );

        return $this->buildResolutionFromComboMatch(
            trim($attackerCharacterId),
            $normalizedStarterMoveIds,
            $comboMatch,
            $availableResources
        );
    }

    /**
     * @param list<string> $starterMoveIds
     * @param list<int>|null $allowedComboIds
     * @param array{health?:float,drive?:float,super?:float,objectStatuses?:array<string,string|int|float|bool>}|null $availableResources
     * @param array{allowedPositions:list<string>,characterStatuses:array<string,string>}|null $comboContext
     *
     * @return array{resolvedDamage:float|null,resolvedComboId:int|null,resolvedStarterMoveId:string|null,resourceContext:array<string,mixed>|null}
     */
    public function resolveWithComboFilter(
        string $attackerCharacterId,
        array $starterMoveIds,
        string $hitType,
        ?array $allowedComboIds,
        ?int $maxDifficulty,
        bool $includeUnratedDifficulty,
        ?array $availableResources = null,
        ?array $comboContext = null,
    ): array {
        $normalizedStarterMoveIds = array_values(array_filter(
            $starterMoveIds,
            static fn (string $starterMoveId): bool => '' !== trim($starterMoveId)
        ));

        if ([] === $normalizedStarterMoveIds || '' === trim($attackerCharacterId)) {
            return $this->emptyResolution();
        }

        $normalizedHitType = $this->normalizeHitType($hitType);

        $comboMatch = $this->comboSequencesRepository->findBestDynamicComboMatchWithExecutionFilter(
            trim($attackerCharacterId),
            $normalizedStarterMoveIds,
            $normalizedHitType,
            $allowedComboIds,
            $maxDifficulty,
            $includeUnratedDifficulty,
            $availableResources['drive'] ?? null,
            $availableResources['super'] ?? null,
            $this->mergeAvailableObjectStatuses($comboContext, $availableResources)
        );

        return $this->buildResolutionFromComboMatch(
            trim($attackerCharacterId),
            $normalizedStarterMoveIds,
            $comboMatch,
            $availableResources
        );
    }

    /**
     * @param list<string> $starterMoveIds
     * @param array{combo_id:int,resolved_damage:int,starter_move_id:string}|null $comboMatch
     * @param array<string,mixed>|null $availableResources
     *
     * @return array{resolvedDamage:float|null,resolvedComboId:int|null,resolvedStarterMoveId:string|null,resourceContext:array<string,mixed>|null}
     */
    private function buildResolutionFromComboMatch(
        string $attackerCharacterId,
        array $starterMoveIds,
        ?array $comboMatch,
        ?array $availableResources
    ): array {
        if (null !== $comboMatch) {
            $combo = $this->comboSequencesRepository->find($comboMatch['combo_id']);
            $resolvedValue = (float) $comboMatch['resolved_damage'];
            $nextResourceContext = $availableResources;
            if (null !== $combo) {
                $resolvedValue = $this->comboValueEstimator->estimateSequenceValue($combo, $availableResources) ?? $resolvedValue;
                $nextResourceContext = $this->comboValueEstimator->applySequenceResourceDeltas($combo, $availableResources);
            }

            return [
                'resolvedDamage' => $resolvedValue,
                'resolvedComboId' => $comboMatch['combo_id'],
                'resolvedStarterMoveId' => $comboMatch['starter_move_id'],
                'resourceContext' => $nextResourceContext,
            ];
        }

        $starterMoveFallback = $this->findStarterMoveFallbackDamage($attackerCharacterId, $starterMoveIds);
        if (null === $starterMoveFallback) {
            return $this->emptyResolution();
        }

        return [
            'resolvedDamage' => (float) $starterMoveFallback['damage'],
            'resolvedComboId' => null,
            'resolvedStarterMoveId' => $starterMoveFallback['move_id'],
            'resourceContext' => $availableResources,
        ];
    }

    /**
     * @param array{allowedPositions:list<string>,characterStatuses:array<string,string>}|null $comboContext
     * @param array<string,mixed>|null $availableResources
     *
     * @return array{allowedPositions:list<string>,characterStatuses:array<string,string>}
     */
    private function mergeAvailableObjectStatuses(?array $comboContext, ?array $availableResources): array
    {
        $merged = $comboContext ?? ['allowedPositions' => ['midscreen'], 'characterStatuses' => []];
        $objectStatuses = is_array($availableResources['objectStatuses'] ?? null) ? $availableResources['objectStatuses'] : [];
        if ([] === $objectStatuses) {
            return $merged;
        }

        $characterStatuses = is_array($merged['characterStatuses'] ?? null) ? $merged['characterStatuses'] : [];
        foreach ($objectStatuses as $objectName => $statusValue) {
            if (!is_string($objectName) || (!is_string($statusValue) && !is_int($statusValue) && !is_float($statusValue) && !is_bool($statusValue))) {
                continue;
            }

            $characterStatuses[$objectName] = true === $statusValue ? 'true' : (string) $statusValue;
        }
        $merged['characterStatuses'] = $characterStatuses;

        return $merged;
    }

    /** @return array{resolvedDamage:null,resolvedComboId:null,resolvedStarterMoveId:null,resourceContext:null} */
    private function emptyResolution(): array
    {
        return [
            'resolvedDamage' => null,
            'resolvedComboId' => null,
            'resolvedStarterMoveId' => null,
            'resourceContext' => null,
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
