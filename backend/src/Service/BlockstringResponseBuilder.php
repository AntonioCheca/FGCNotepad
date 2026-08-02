<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\BlockstringDefenseEntry;
use App\Entity\BlockstringAdaptation;
use App\Entity\BlockstringAdaptationComboSearch;
use App\Entity\BlockstringAdaptationStep;
use App\Entity\BlockstringGap;
use App\Entity\BlockstringSequence;
use App\Entity\BlockstringSequenceStep;
use App\Entity\ComboSpacing;
use App\Entity\Move;
use App\Entity\Situation;

class BlockstringResponseBuilder
{
    /** @return list<array<string, mixed>> */
    public function buildList(array $sequences): array
    {
        return array_map(fn (BlockstringSequence $sequence): array => $this->buildSummary($sequence), $sequences);
    }

    /** @return array<string, mixed> */
    public function buildSummary(BlockstringSequence $sequence): array
    {
        return [
            'id' => $sequence->getId(),
            'title' => $sequence->getTitle(),
            'summary' => $sequence->getSummary(),
            'classification' => $sequence->getClassification(),
            'moderationState' => $sequence->getModerationState(),
            'attackerCharacter' => $this->buildCharacter($sequence->getAttackerCharacter()),
            'notation' => $this->buildNotation($sequence),
            'steps' => array_values(array_map(fn (BlockstringSequenceStep $step): array => $this->buildStep($step), $sequence->getSteps()->toArray())),
            'gaps' => array_values(array_map(fn (BlockstringGap $gap): array => $this->buildGap($gap), $this->sortGaps($sequence->getGaps()->toArray()))),
            'defenseEntryCount' => $sequence->getDefenseEntries()->count(),
        ];
    }

    /** @return array<string, mixed> */
    public function buildDetail(BlockstringSequence $sequence): array
    {
        return $this->buildSummary($sequence) + [
            'conditions' => array_values(array_map(static fn ($condition): array => [
                'id' => $condition->getId(),
                'kind' => $condition->getKind(),
                'value' => $condition->getValue(),
                'note' => $condition->getNote(),
            ], $sequence->getConditions()->toArray())),
            'defenseEntries' => array_values(array_map(fn (BlockstringDefenseEntry $entry): array => $this->buildDefenseEntry($entry), $this->sortDefenseEntries($sequence->getDefenseEntries()->toArray()))),
            'adaptations' => array_values(array_map(fn (BlockstringAdaptation $adaptation): array => $this->buildAdaptation($adaptation), $this->sortAdaptations($sequence->getAdaptations()->toArray()))),
        ];
    }

    private function buildNotation(BlockstringSequence $sequence): string
    {
        $tokens = [];
        foreach ($sequence->getSteps() as $step) {
            $move = $step->getMove();
            if ($move instanceof Move) {
                $tokens[] = $move->getNumpadNotation();
            }
        }

        return implode(' -> ', $tokens);
    }

    /** @return array<string, mixed>|null */
    private function buildCharacter(mixed $character): ?array
    {
        if (!is_object($character) || !method_exists($character, 'getId') || !method_exists($character, 'getName')) {
            return null;
        }

        return ['id' => (string) $character->getId(), 'name' => $character->getName()];
    }

    /** @return array<string, mixed> */
    private function buildStep(BlockstringSequenceStep $step): array
    {
        $move = $step->getMove();

        return [
            'id' => $step->getId(),
            'ordinal' => $step->getOrdinal(),
            'move' => $move instanceof Move ? [
                'id' => (string) $move->getId(),
                'numpadNotation' => $move->getNumpadNotation(),
                'character' => $this->buildCharacter($move->getCharacter()),
            ] : null,
            'canConfirmOnHit' => $step->canConfirmOnHit(),
            'note' => $step->getNote(),
        ];
    }

    /** @return array<string, mixed> */
    private function buildGap(BlockstringGap $gap): array
    {
        return [
            'id' => $gap->getId(),
            'stepOrdinal' => $gap->getStep()?->getOrdinal(),
            'timing' => $gap->getTiming(),
            'frames' => $gap->getFrames(),
            'frameAdvantage' => $gap->getAttackerFrameAdvantage(),
            'classification' => $gap->getClassification(),
            'adaptationCount' => $this->countAdaptationsForGap($gap),
        ];
    }

    /** @return array<string, mixed> */
    private function buildAdaptation(BlockstringAdaptation $adaptation): array
    {
        return [
            'id' => $adaptation->getId(),
            'gapId' => $adaptation->getGap()?->getId(),
            'gapStepOrdinal' => $adaptation->getGap()?->getStep()?->getOrdinal(),
            'explanation' => $adaptation->getExplanation(),
            'steps' => array_values(array_map(fn (BlockstringAdaptationStep $step): array => $this->buildAdaptationStep($step), $adaptation->getSteps()->toArray())),
            'comboSearch' => $this->buildComboSearch($adaptation->getComboSearch()),
        ];
    }

    /** @return array<string, mixed> */
    private function buildAdaptationStep(BlockstringAdaptationStep $step): array
    {
        $move = $step->getMove();

        return [
            'id' => $step->getId(),
            'ordinal' => $step->getOrdinal(),
            'move' => $move instanceof Move ? [
                'id' => (string) $move->getId(),
                'numpadNotation' => $move->getNumpadNotation(),
                'character' => $this->buildCharacter($move->getCharacter()),
            ] : null,
        ];
    }

    /** @return array<string, mixed>|null */
    private function buildComboSearch(?BlockstringAdaptationComboSearch $search): ?array
    {
        if (!$search instanceof BlockstringAdaptationComboSearch) {
            return null;
        }
        $firstMove = $search->getFirstMove();
        $enderMove = $search->getEnderMove();
        $situation = $search->getSituation();
        $spacing = $search->getSpacing();
        $filters = array_filter([
            'characterId' => (string) $search->getCharacter()?->getId(),
            'firstMoveId' => $firstMove instanceof Move ? (string) $firstMove->getId() : null,
            'enderMoveId' => $enderMove instanceof Move ? (string) $enderMove->getId() : null,
            'situationId' => $situation instanceof Situation ? $situation->getId() : null,
            'spacingCodes' => $spacing instanceof ComboSpacing ? [$spacing->getCode()] : null,
            'minDamage' => $search->getMinDamage(),
            'maxDamage' => $search->getMaxDamage(),
            'minDriveCost' => $search->getMinDriveCost(),
            'maxDriveCost' => $search->getMaxDriveCost(),
            'counterHitRequired' => $search->getCounterHitRequired(),
            'punishCounterRequired' => $search->getPunishCounterRequired(),
            'cornerRequired' => $search->getCornerRequired(),
        ], static fn (mixed $value): bool => null !== $value && '' !== $value);
        $queryFilters = $filters;
        if (isset($queryFilters['spacingCodes']) && is_array($queryFilters['spacingCodes'])) {
            $queryFilters['spacingCodes'] = implode(',', $queryFilters['spacingCodes']);
        }

        return [
            'character' => $this->buildCharacter($search->getCharacter()),
            'firstMove' => $firstMove instanceof Move ? ['id' => (string) $firstMove->getId(), 'numpadNotation' => $firstMove->getNumpadNotation(), 'character' => $this->buildCharacter($firstMove->getCharacter())] : null,
            'enderMove' => $enderMove instanceof Move ? ['id' => (string) $enderMove->getId(), 'numpadNotation' => $enderMove->getNumpadNotation(), 'character' => $this->buildCharacter($enderMove->getCharacter())] : null,
            'situation' => $situation instanceof Situation ? ['id' => $situation->getId(), 'name' => $situation->getName(), 'typeName' => $situation->getType()->getName(), 'typeCode' => $situation->getType()->getCode()] : null,
            'spacing' => $spacing instanceof ComboSpacing ? ['id' => $spacing->getId(), 'code' => $spacing->getCode(), 'name' => $spacing->getName()] : null,
            'filters' => $filters,
            'url' => '/combos?' . http_build_query($queryFilters),
        ];
    }

    /** @return array<string, mixed> */
    private function buildDefenseEntry(BlockstringDefenseEntry $entry): array
    {
        $move = $entry->getMove();
        $gap = $entry->getGap();

        return [
            'id' => $entry->getId(),
            'gapId' => $gap?->getId(),
            'gapStepOrdinal' => $gap?->getStep()?->getOrdinal(),
            'instruction' => $entry->getInstruction(),
            'exceptionNotes' => $entry->getExceptionNotes(),
            'defenderCharacter' => $this->buildCharacter($entry->getDefenderCharacter()),
            'move' => $move instanceof Move ? [
                'id' => (string) $move->getId(),
                'numpadNotation' => $move->getNumpadNotation(),
                'character' => $this->buildCharacter($move->getCharacter()),
            ] : null,
            'responseType' => $entry->getResponseType(),
            'outcome' => $entry->getOutcome(),
            'conversion' => $entry->getConversion(),
        ];
    }

    /** @param list<BlockstringGap> $gaps @return list<BlockstringGap> */
    private function sortGaps(array $gaps): array
    {
        usort($gaps, static fn (BlockstringGap $first, BlockstringGap $second): int => [$first->getStep()?->getOrdinal() ?? PHP_INT_MAX, 'before_step' === $first->getTiming() ? 0 : 1, $first->getId() ?? PHP_INT_MAX] <=> [$second->getStep()?->getOrdinal() ?? PHP_INT_MAX, 'before_step' === $second->getTiming() ? 0 : 1, $second->getId() ?? PHP_INT_MAX]);

        return $gaps;
    }

    /** @param list<BlockstringDefenseEntry> $entries @return list<BlockstringDefenseEntry> */
    private function sortDefenseEntries(array $entries): array
    {
        usort($entries, static function (BlockstringDefenseEntry $first, BlockstringDefenseEntry $second): int {
            $firstGap = $first->getGap();
            $secondGap = $second->getGap();

            return [$firstGap?->getStep()?->getOrdinal() ?? PHP_INT_MAX, 'before_step' === $firstGap?->getTiming() ? 0 : 1, $firstGap?->getId() ?? PHP_INT_MAX, $first->getId() ?? PHP_INT_MAX] <=> [$secondGap?->getStep()?->getOrdinal() ?? PHP_INT_MAX, 'before_step' === $secondGap?->getTiming() ? 0 : 1, $secondGap?->getId() ?? PHP_INT_MAX, $second->getId() ?? PHP_INT_MAX];
        });

        return $entries;
    }

    /** @param list<BlockstringAdaptation> $adaptations @return list<BlockstringAdaptation> */
    private function sortAdaptations(array $adaptations): array
    {
        usort($adaptations, static function (BlockstringAdaptation $first, BlockstringAdaptation $second): int {
            $firstGap = $first->getGap();
            $secondGap = $second->getGap();

            return [$firstGap?->getStep()?->getOrdinal() ?? PHP_INT_MAX, 'before_step' === $firstGap?->getTiming() ? 0 : 1, $first->getSortOrder(), $first->getId() ?? PHP_INT_MAX] <=> [$secondGap?->getStep()?->getOrdinal() ?? PHP_INT_MAX, 'before_step' === $secondGap?->getTiming() ? 0 : 1, $second->getSortOrder(), $second->getId() ?? PHP_INT_MAX];
        });

        return $adaptations;
    }

    private function countAdaptationsForGap(BlockstringGap $gap): int
    {
        $sequence = $gap->getSequence();
        if (!$sequence instanceof BlockstringSequence) {
            return 0;
        }

        return count(array_filter($sequence->getAdaptations()->toArray(), static fn (BlockstringAdaptation $adaptation): bool => $adaptation->getGap() === $gap));
    }
}
