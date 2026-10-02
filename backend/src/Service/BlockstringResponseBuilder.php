<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\BlockstringDefenseEntry;
use App\Entity\BlockstringEdge;
use App\Entity\BlockstringSequence;
use App\Entity\BlockstringSequenceStep;
use App\Entity\Move;
use App\Util\Enum\PressureEdgeKind;

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
            'nodeCount' => $sequence->getSteps()->count(),
            'defenseEntryCount' => $sequence->getDefenseEntries()->count(),
            'gaps' => $this->buildGapSummaries($sequence),
        ];
    }

    /**
     * Transitions with a documented gap, for list views that show where pressure can be interrupted.
     *
     * @return list<array<string, mixed>>
     */
    private function buildGapSummaries(BlockstringSequence $sequence): array
    {
        $gaps = [];
        foreach ($sequence->getEdges() as $edge) {
            if (null === $edge->getGapFrames()) {
                continue;
            }
            $gaps[] = [
                'from' => $edge->getFromStep()?->getMove()?->getNumpadNotation(),
                'to' => $edge->getToStep()?->getMove()?->getNumpadNotation(),
                'gapFrames' => $edge->getGapFrames(),
                'frameAdvantage' => $edge->getFrameAdvantage(),
                'kind' => $edge->getKind(),
            ];
        }

        return $gaps;
    }

    /** @return array<string, mixed> */
    public function buildDetail(BlockstringSequence $sequence): array
    {
        return $this->buildSummary($sequence) + [
            'nodes' => array_values(array_map(fn (BlockstringSequenceStep $node): array => $this->buildNode($node), $sequence->getSteps()->toArray())),
            'edges' => array_values(array_map(fn (BlockstringEdge $edge): array => $this->buildEdge($edge), $sequence->getEdges()->toArray())),
            'conditions' => array_values(array_map(static fn ($condition): array => [
                'id' => $condition->getId(),
                'kind' => $condition->getKind(),
                'value' => $condition->getValue(),
                'note' => $condition->getNote(),
            ], $sequence->getConditions()->toArray())),
            'defenseEntries' => array_values(array_map(fn (BlockstringDefenseEntry $entry): array => $this->buildDefenseEntry($entry), $sequence->getDefenseEntries()->toArray())),
        ];
    }

    /**
     * Autopilot route for list views: follow layer-1 normal edges from the first node.
     */
    private function buildNotation(BlockstringSequence $sequence): string
    {
        $nodes = array_values($sequence->getSteps()->toArray());
        $current = $nodes[0] ?? null;
        $tokens = [];
        $visited = [];
        while ($current instanceof BlockstringSequenceStep && !isset($visited[spl_object_id($current)])) {
            $visited[spl_object_id($current)] = true;
            $move = $current->getMove();
            if ($move instanceof Move) {
                $tokens[] = $move->getNumpadNotation();
            }
            $current = $this->nextAutopilotNode($sequence, $current);
        }

        return implode(' -> ', $tokens);
    }

    private function nextAutopilotNode(BlockstringSequence $sequence, BlockstringSequenceStep $node): ?BlockstringSequenceStep
    {
        foreach ($sequence->getEdges() as $edge) {
            if ($edge->getFromStep() === $node && PressureEdgeKind::NORMAL->value === $edge->getKind() && 1 === $edge->getLayer()) {
                return $edge->getToStep();
            }
        }

        return null;
    }

    /** @return array<string, mixed>|null */
    private function buildCharacter(mixed $character): ?array
    {
        if (!is_object($character) || !method_exists($character, 'getId') || !method_exists($character, 'getName')) {
            return null;
        }

        return ['id' => (string) $character->getId(), 'name' => $character->getName()];
    }

    /** @return array<string, mixed>|null */
    private function buildMove(?Move $move): ?array
    {
        return $move instanceof Move ? [
            'id' => (string) $move->getId(),
            'numpadNotation' => $move->getNumpadNotation(),
            'moveName' => $move->getFrameData()?->getMoveName(),
            'character' => $this->buildCharacter($move->getCharacter()),
        ] : null;
    }

    /** @return array<string, mixed> */
    private function buildNode(BlockstringSequenceStep $node): array
    {
        return [
            'id' => (string) $node->getId(),
            'move' => $this->buildMove($node->getMove()),
            'layer' => $node->getLayer(),
            'damageDealt' => $node->getDamageDealt(),
            'damageReceived' => $node->getDamageReceived(),
        ];
    }

    /** @return array<string, mixed> */
    private function buildEdge(BlockstringEdge $edge): array
    {
        return [
            'id' => (string) $edge->getId(),
            'from' => (string) $edge->getFromStep()?->getId(),
            'to' => (string) $edge->getToStep()?->getId(),
            'kind' => $edge->getKind(),
            'readLabel' => $edge->getReadLabel(),
            'layer' => $edge->getLayer(),
            'frameAdvantage' => $edge->getFrameAdvantage(),
            'gapFrames' => $edge->getGapFrames(),
        ];
    }

    /** @return array<string, mixed> */
    private function buildDefenseEntry(BlockstringDefenseEntry $entry): array
    {
        return [
            'id' => $entry->getId(),
            'edgeId' => (string) $entry->getEdge()?->getId(),
            'instruction' => $entry->getInstruction(),
            'exceptionNotes' => $entry->getExceptionNotes(),
            'defenderCharacter' => $this->buildCharacter($entry->getDefenderCharacter()),
            'move' => $this->buildMove($entry->getMove()),
            'responseType' => $entry->getResponseType(),
            'outcome' => $entry->getOutcome(),
            'conversion' => $entry->getConversion(),
        ];
    }
}
