<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Scenario;
use App\Entity\ScenarioCell;
use App\Entity\User;
use App\Repository\ComboSequencesRepository;
use App\Repository\ScenarioRepository;
use App\Repository\UserComboRepository;

class ComboRecommendationService
{
    public function __construct(
        private readonly UserComboRepository $userComboRepository,
        private readonly ScenarioRepository $scenarioRepository,
        private readonly ComboSequencesRepository $comboSequencesRepository,
        private readonly ResolveDynamicComboCellService $resolveDynamicComboCellService,
    ) {
    }

    /**
     * @return array{essentialScenarioCount:int,recommendations:list<array{comboId:int,comboName:string,averageEvGainPerScenario:float}>}
     */
    public function recommend(User $user, string $characterId, int $difficultyCap): array
    {
        $userId = $user->getId();
        if (null === $userId) {
            return [
                'essentialScenarioCount' => 0,
                'recommendations' => [],
            ];
        }

        $knownComboIds = $this->userComboRepository->findKnownComboIdsByUserAndCharacterId($userId, $characterId);
        $essentialScenarios = $this->scenarioRepository->findEssentialByCharacterId($characterId);
        $essentialScenarioCount = count($essentialScenarios);

        if (0 === $essentialScenarioCount) {
            return [
                'essentialScenarioCount' => 0,
                'recommendations' => [],
            ];
        }

        $candidateRows = $this->comboSequencesRepository->findEssentialCandidateRowsByCharacterAndDifficulty(
            $characterId,
            $difficultyCap,
            $knownComboIds
        );

        if ([] === $candidateRows) {
            return [
                'essentialScenarioCount' => $essentialScenarioCount,
                'recommendations' => [],
            ];
        }

        $baselineTotalEv = $this->calculateTotalEv($essentialScenarios, $knownComboIds);

        $recommendations = [];
        foreach ($candidateRows as $candidateRow) {
            $candidateComboId = (int) $candidateRow['id'];
            $candidatePool = array_values(array_unique([...$knownComboIds, $candidateComboId]));
            $candidateTotalEv = $this->calculateTotalEv($essentialScenarios, $candidatePool);

            $recommendations[] = [
                'comboId' => $candidateComboId,
                'comboName' => (string) $candidateRow['name'],
                'averageEvGainPerScenario' => ($candidateTotalEv - $baselineTotalEv) / $essentialScenarioCount,
            ];
        }

        usort(
            $recommendations,
            static fn (array $left, array $right): int =>
                $right['averageEvGainPerScenario'] <=> $left['averageEvGainPerScenario']
                    ?: strcmp($left['comboName'], $right['comboName'])
        );

        return [
            'essentialScenarioCount' => $essentialScenarioCount,
            'recommendations' => array_slice($recommendations, 0, 3),
        ];
    }

    /**
     * @param list<Scenario> $scenarios
     * @param list<int> $allowedComboIds
     */
    private function calculateTotalEv(array $scenarios, array $allowedComboIds): float
    {
        $total = 0.0;

        foreach ($scenarios as $scenario) {
            $total += $this->calculateScenarioEv($scenario, $allowedComboIds);
        }

        return $total;
    }

    /**
     * @param list<int> $allowedComboIds
     */
    private function calculateScenarioEv(Scenario $scenario, array $allowedComboIds): float
    {
        $rowFrequencyById = [];
        foreach ($scenario->getRows() as $row) {
            $rowId = $row->getId();
            if (null === $rowId || null === $row->getSummaryValue()) {
                continue;
            }

            $rowFrequencyById[$rowId] = $row->getSummaryValue();
        }

        $columnFrequencyById = [];
        foreach ($scenario->getColumns() as $column) {
            $columnId = $column->getId();
            if (null === $columnId || null === $column->getSummaryValue()) {
                continue;
            }

            $columnFrequencyById[$columnId] = $column->getSummaryValue();
        }

        $ev = 0.0;
        foreach ($scenario->getCells() as $cell) {
            $rowId = $cell->getRow()?->getId();
            $columnId = $cell->getColumn()?->getId();
            if (null === $rowId || null === $columnId) {
                continue;
            }

            $rowFrequency = $rowFrequencyById[$rowId] ?? null;
            $columnFrequency = $columnFrequencyById[$columnId] ?? null;
            if (!is_float($rowFrequency) || !is_float($columnFrequency)) {
                continue;
            }

            $cellValue = $this->resolveCellValue($scenario, $cell, $allowedComboIds);
            if (null === $cellValue) {
                continue;
            }

            $ev += $rowFrequency * $columnFrequency * $cellValue;
        }

        return $ev;
    }

    /**
     * @param list<int> $allowedComboIds
     */
    private function resolveCellValue(Scenario $scenario, ScenarioCell $cell, array $allowedComboIds): ?float
    {
        if (ScenarioCell::KIND_STATIC === $cell->getKind()) {
            return $cell->getStaticValue();
        }

        if (ScenarioCell::KIND_REFERENCE === $cell->getKind()) {
            return $cell->getCachedValue();
        }

        if (ScenarioCell::KIND_DYNAMIC_COMBO !== $cell->getKind()) {
            return null;
        }

        $attackerCharacterId = $scenario->getAttackerCharacter()?->getId()?->toRfc4122();
        if (null === $attackerCharacterId || '' === $attackerCharacterId) {
            return null;
        }

        $starterMoveIds = [];
        foreach ($cell->getStarterMoves() as $starterMove) {
            $starterMoveId = $starterMove->getId()?->toRfc4122();
            if (null !== $starterMoveId && '' !== $starterMoveId) {
                $starterMoveIds[] = $starterMoveId;
            }
        }

        $resolution = $this->resolveDynamicComboCellService->resolveWithComboFilter(
            $attackerCharacterId,
            $starterMoveIds,
            $this->toHitType($cell->getStarterContext()),
            $allowedComboIds,
            null,
            false
        );

        return null !== $resolution['resolvedDamage'] ? (float) $resolution['resolvedDamage'] : null;
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
