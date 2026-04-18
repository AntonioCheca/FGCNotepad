<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Move;
use App\Entity\Scenario;
use App\Entity\ScenarioCell;
use App\Entity\ScenarioColumn;
use App\Entity\ScenarioRow;
use App\Repository\MoveRepository;
use App\Repository\ScenarioRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class ScenarioMatrixMapper
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly ScenarioRepository $scenarioRepository,
        private readonly MoveRepository $moveRepository,
    ) {
    }

    /**
     * @param array<string, mixed> $matrix
     */
    public function replaceScenarioMatrixFromPayload(Scenario $scenario, array $matrix): void
    {
        $axes = $matrix['axes'] ?? null;
        $rows = is_array($axes['rows'] ?? null) ? $axes['rows'] : null;
        $columns = is_array($axes['columns'] ?? null) ? $axes['columns'] : null;

        if (null === $rows || null === $columns || [] === $rows || [] === $columns) {
            throw new BadRequestHttpException('Matrix payload must include non-empty axes.rows and axes.columns.');
        }

        $cells = is_array($matrix['cells'] ?? null) ? $matrix['cells'] : null;
        if (null === $cells) {
            throw new BadRequestHttpException('Matrix payload must include cells.');
        }

        $summary = is_array($matrix['summary'] ?? null) ? $matrix['summary'] : [];
        $rowAxis = is_array($summary['rowAxis'] ?? null) ? $summary['rowAxis'] : [];
        $columnAxis = is_array($summary['columnAxis'] ?? null) ? $summary['columnAxis'] : [];

        foreach ($scenario->getCells()->toArray() as $cell) {
            $scenario->removeCell($cell);
            $this->entityManager->remove($cell);
        }
        foreach ($scenario->getRows()->toArray() as $row) {
            $scenario->removeRow($row);
            $this->entityManager->remove($row);
        }
        foreach ($scenario->getColumns()->toArray() as $column) {
            $scenario->removeColumn($column);
            $this->entityManager->remove($column);
        }

        $rowEntities = [];
        foreach ($rows as $index => $rowLabel) {
            $row = (new ScenarioRow())
                ->setScenario($scenario)
                ->setPosition($index)
                ->setLabel($this->normalizeLabel($rowLabel, sprintf('Row %d', $index + 1)))
                ->setSummaryValue($this->extractNumericValue($rowAxis[$index] ?? null));

            $scenario->addRow($row);
            $rowEntities[$index] = $row;
        }

        $columnEntities = [];
        foreach ($columns as $index => $columnLabel) {
            $column = (new ScenarioColumn())
                ->setScenario($scenario)
                ->setPosition($index)
                ->setLabel($this->normalizeLabel($columnLabel, sprintf('Column %d', $index + 1)))
                ->setSummaryValue($this->extractNumericValue($columnAxis[$index] ?? null));

            $scenario->addColumn($column);
            $columnEntities[$index] = $column;
        }

        foreach ($rowEntities as $rowIndex => $rowEntity) {
            $sourceRow = is_array($cells[$rowIndex] ?? null) ? $cells[$rowIndex] : [];

            foreach ($columnEntities as $columnIndex => $columnEntity) {
                $sourceCell = is_array($sourceRow[$columnIndex] ?? null) ? $sourceRow[$columnIndex] : [];
                $cell = $this->buildCellFromPayload($scenario, $rowEntity, $columnEntity, $sourceCell);
                $scenario->addCell($cell);
            }
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function buildMatrixPayload(Scenario $scenario): array
    {
        $rows = $scenario->getRows()->toArray();
        usort($rows, static fn (ScenarioRow $a, ScenarioRow $b): int => $a->getPosition() <=> $b->getPosition());

        $columns = $scenario->getColumns()->toArray();
        usort($columns, static fn (ScenarioColumn $a, ScenarioColumn $b): int => $a->getPosition() <=> $b->getPosition());

        $cellByCoordinate = [];
        foreach ($scenario->getCells() as $cell) {
            $rowId = $cell->getRow()?->getId();
            $columnId = $cell->getColumn()?->getId();
            if (null === $rowId || null === $columnId) {
                continue;
            }
            $cellByCoordinate[sprintf('%d:%d', $rowId, $columnId)] = $cell;
        }

        $matrixCells = [];
        foreach ($rows as $row) {
            $matrixRow = [];
            foreach ($columns as $column) {
                $key = sprintf('%d:%d', $row->getId(), $column->getId());
                $matrixRow[] = $this->buildCellPayload($cellByCoordinate[$key] ?? null);
            }
            $matrixCells[] = $matrixRow;
        }

        return [
            'kind' => 'matrix-editor',
            'schemaVersion' => 1,
            'axes' => [
                'rows' => array_map(static fn (ScenarioRow $row): string => $row->getLabel(), $rows),
                'columns' => array_map(static fn (ScenarioColumn $column): string => $column->getLabel(), $columns),
            ],
            'cells' => $matrixCells,
            'summary' => [
                'rowAxis' => array_map(fn (ScenarioRow $row): array => $this->buildSummaryCell($row->getSummaryValue()), $rows),
                'columnAxis' => array_map(fn (ScenarioColumn $column): array => $this->buildSummaryCell($column->getSummaryValue()), $columns),
                'expectedValue' => [
                    'cellType' => 'summary',
                    'dataType' => 'empty',
                    'value' => null,
                ],
            ],
            'metadata' => [
                'matrixId' => $scenario->getPublicId()->toRfc4122(),
                'title' => $scenario->getName(),
                'source' => 'editor',
                'updatedAt' => $scenario->getUpdatedAt()->format(DATE_ATOM),
            ],
        ];
    }

    /**
     * @param array<string, mixed> $sourceCell
     */
    private function buildCellFromPayload(
        Scenario $scenario,
        ScenarioRow $row,
        ScenarioColumn $column,
        array $sourceCell
    ): ScenarioCell {
        $cellType = isset($sourceCell['cellType']) && is_string($sourceCell['cellType']) ? $sourceCell['cellType'] : 'value';

        $cell = (new ScenarioCell())
            ->setScenario($scenario)
            ->setRow($row)
            ->setColumn($column);

        if ('reference' === $cellType || 'computed' === $cellType) {
            $metadata = is_array($sourceCell['metadata'] ?? null) ? $sourceCell['metadata'] : [];
            $referenceScenarioId = isset($metadata['scenarioId']) && is_string($metadata['scenarioId']) ? trim($metadata['scenarioId']) : '';
            if ('' === $referenceScenarioId) {
                throw new BadRequestHttpException('Reference cells require metadata.scenarioId.');
            }

            $referenceScenario = $this->scenarioRepository->findOneByPublicId($referenceScenarioId);
            if (null === $referenceScenario) {
                throw new BadRequestHttpException(sprintf('Referenced scenario %s was not found.', $referenceScenarioId));
            }

            $referenceKind = isset($metadata['referenceKind']) && is_string($metadata['referenceKind']) ? $metadata['referenceKind'] : 'reference';

            return $cell
                ->setKind(ScenarioCell::KIND_REFERENCE)
                ->setReferenceScenario($referenceScenario)
                ->setReferenceKind('computed' === $referenceKind ? 'computed' : 'reference')
                ->setCachedValue($this->extractNumericValue($sourceCell));
        }

        if ('dynamic_combo' === $cellType) {
            $dynamicCombo = is_array($sourceCell['dynamicCombo'] ?? null) ? $sourceCell['dynamicCombo'] : null;
            if (null === $dynamicCombo) {
                throw new BadRequestHttpException('dynamic_combo cells require dynamicCombo payload.');
            }

            $starterMoveIds = is_array($dynamicCombo['starterMoveIds'] ?? null) ? $dynamicCombo['starterMoveIds'] : [];
            if ([] === $starterMoveIds) {
                throw new BadRequestHttpException('dynamic_combo cells require at least one starter move id.');
            }

            $starterContext = is_array($dynamicCombo['starterContext'] ?? null) ? $dynamicCombo['starterContext'] : [];
            $contextValue = $this->resolveStarterContext($starterContext);

            $cell->setKind(ScenarioCell::KIND_DYNAMIC_COMBO)
                ->setStarterContext($contextValue)
                ->setCachedValue($this->extractNumericValue($sourceCell));

            foreach ($starterMoveIds as $moveId) {
                if (!is_string($moveId) || '' === trim($moveId)) {
                    continue;
                }

                /** @var Move|null $move */
                $move = $this->moveRepository->find(trim($moveId));
                if (null === $move) {
                    throw new BadRequestHttpException(sprintf('Starter move %s was not found.', (string) $moveId));
                }

                $cell->addStarterMove($move);
            }

            if (0 === $cell->getStarterMoves()->count()) {
                throw new BadRequestHttpException('dynamic_combo cells require at least one valid starter move id.');
            }

            return $cell;
        }

        return $cell
            ->setKind(ScenarioCell::KIND_STATIC)
            ->setStaticValue($this->extractNumericValue($sourceCell));
    }

    /**
     * @return array<string, mixed>
     */
    private function buildCellPayload(?ScenarioCell $cell): array
    {
        if (null === $cell || ScenarioCell::KIND_STATIC === $cell->getKind()) {
            return [
                'cellType' => 'value',
                'dataType' => null !== $cell?->getStaticValue() ? 'number' : 'empty',
                'value' => $cell?->getStaticValue(),
            ];
        }

        if (ScenarioCell::KIND_REFERENCE === $cell->getKind()) {
            $reference = $cell->getReferenceScenario();

            return [
                'cellType' => 'reference',
                'dataType' => null !== $cell->getCachedValue() ? 'number' : 'empty',
                'value' => $cell->getCachedValue(),
                'metadata' => [
                    'scenarioId' => $reference?->getPublicId()->toRfc4122(),
                    'scenarioLabel' => $reference?->getName(),
                    'cachedValue' => $cell->getCachedValue(),
                    'referenceKind' => $cell->getReferenceKind() ?? 'reference',
                ],
            ];
        }

        $starterMoves = [];
        foreach ($cell->getStarterMoves() as $starterMove) {
            $starterMoves[] = $starterMove->getId()?->toRfc4122();
        }

        return [
            'cellType' => 'dynamic_combo',
            'dataType' => null !== $cell->getCachedValue() ? 'number' : 'empty',
            'value' => $cell->getCachedValue(),
            'dynamicCombo' => [
                'attackerCharacterId' => $cell->getScenario()?->getAttackerCharacter()?->getId()?->toRfc4122() ?? '',
                'starterMoveIds' => array_values(array_filter($starterMoves, static fn (?string $value): bool => null !== $value && '' !== $value)),
                'starterContext' => $this->toStarterContextPayload($cell->getStarterContext()),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function buildSummaryCell(?float $value): array
    {
        return [
            'cellType' => 'summary',
            'dataType' => null !== $value ? 'number' : 'empty',
            'value' => $value,
        ];
    }

    /**
     * @param array<string, mixed> $starterContext
     */
    private function resolveStarterContext(array $starterContext): string
    {
        $isPunishCounter = isset($starterContext['isPunishCounter']) && true === $starterContext['isPunishCounter'];
        $isCounterHit = isset($starterContext['isCounterHit']) && true === $starterContext['isCounterHit'];

        if ($isPunishCounter && $isCounterHit) {
            throw new BadRequestHttpException('starterContext cannot set both isPunishCounter and isCounterHit to true.');
        }

        if ($isPunishCounter) {
            return 'punish_counter';
        }

        if ($isCounterHit) {
            return 'counter_hit';
        }

        return 'normal';
    }

    /**
     * @return array<string, bool>
     */
    private function toStarterContextPayload(?string $starterContext): array
    {
        return [
            'isPunishCounter' => 'punish_counter' === $starterContext,
            'isCounterHit' => 'counter_hit' === $starterContext,
        ];
    }

    private function normalizeLabel(mixed $value, string $fallback): string
    {
        if (!is_string($value)) {
            return $fallback;
        }

        $trimmed = trim($value);

        return '' !== $trimmed ? $trimmed : $fallback;
    }

    private function extractNumericValue(mixed $cellOrSummary): ?float
    {
        if (!is_array($cellOrSummary)) {
            return null;
        }

        $value = $cellOrSummary['value'] ?? null;
        if (is_numeric($value)) {
            return (float) $value;
        }

        return null;
    }
}
