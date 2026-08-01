<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\BlockstringDefenseAnswer;
use App\Entity\BlockstringDefenseEntry;
use App\Entity\BlockstringOffensePlan;
use App\Entity\BlockstringSequence;
use App\Entity\BlockstringSequenceStep;
use App\Entity\Move;

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
            'gapAfterStep' => $sequence->getGapAfterStep(),
            'maxInterruptStartup' => $sequence->getMaxInterruptStartup(),
            'moderationState' => $sequence->getModerationState(),
            'attackerCharacter' => $this->buildCharacter($sequence->getAttackerCharacter()),
            'notation' => $this->buildNotation($sequence),
            'steps' => array_map(fn (BlockstringSequenceStep $step): array => $this->buildStep($step), $sequence->getSteps()->toArray()),
            'offensePlanCount' => $sequence->getOffensePlans()->count(),
            'defenseEntryCount' => $sequence->getDefenseEntries()->count(),
        ];
    }

    /** @return array<string, mixed> */
    public function buildDetail(BlockstringSequence $sequence): array
    {
        return $this->buildSummary($sequence) + [
            'conditions' => array_map(static fn ($condition): array => [
                'id' => $condition->getId(),
                'kind' => $condition->getKind(),
                'value' => $condition->getValue(),
                'note' => $condition->getNote(),
            ], $sequence->getConditions()->toArray()),
            'offensePlans' => array_map(fn (BlockstringOffensePlan $plan): array => $this->buildOffensePlan($plan), $sequence->getOffensePlans()->toArray()),
            'defenseEntries' => array_map(fn (BlockstringDefenseEntry $entry): array => $this->buildDefenseEntry($entry), $sequence->getDefenseEntries()->toArray()),
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
            'gapBefore' => $step->hasGapBefore(),
            'gapFrames' => $step->getGapFrames(),
            'canConfirmOnHit' => $step->canConfirmOnHit(),
            'note' => $step->getNote(),
        ];
    }

    /** @return array<string, mixed> */
    private function buildOffensePlan(BlockstringOffensePlan $plan): array
    {
        return [
            'id' => $plan->getId(),
            'label' => $plan->getLabel(),
            'planRole' => $plan->getPlanRole(),
            'targetBehavior' => $plan->getTargetBehavior(),
            'purpose' => $plan->getPurpose(),
            'onHit' => $plan->getOnHit(),
            'onBlock' => $plan->getOnBlock(),
            'losesTo' => $plan->getLosesTo(),
            'authorExplanation' => $plan->getAuthorExplanation(),
            'sortOrder' => $plan->getSortOrder(),
        ];
    }

    /** @return array<string, mixed> */
    private function buildDefenseEntry(BlockstringDefenseEntry $entry): array
    {
        return [
            'id' => $entry->getId(),
            'actAfterStep' => $entry->getActAfterStep(),
            'instruction' => $entry->getInstruction(),
            'exceptionNotes' => $entry->getExceptionNotes(),
            'answers' => array_map(fn (BlockstringDefenseAnswer $answer): array => $this->buildDefenseAnswer($answer), $entry->getAnswers()->toArray()),
        ];
    }

    /** @return array<string, mixed> */
    private function buildDefenseAnswer(BlockstringDefenseAnswer $answer): array
    {
        $move = $answer->getMove();

        return [
            'id' => $answer->getId(),
            'defenderCharacter' => $this->buildCharacter($answer->getDefenderCharacter()),
            'move' => $move instanceof Move ? [
                'id' => (string) $move->getId(),
                'numpadNotation' => $move->getNumpadNotation(),
                'character' => $this->buildCharacter($move->getCharacter()),
            ] : null,
            'responseType' => $answer->getResponseType(),
            'startupFrames' => $answer->getStartupFrames(),
            'outcome' => $answer->getOutcome(),
            'conversion' => $answer->getConversion(),
            'recommended' => $answer->isRecommended(),
        ];
    }
}
