<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\BlockstringBlock;
use App\Entity\BlockstringEdge;
use App\Entity\BlockstringSequence;
use App\Entity\BlockstringSequenceStep;
use App\Entity\Character;
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
            'moderationState' => $sequence->getModerationState(),
            'attackerCharacter' => $this->buildCharacter($sequence->getAttackerCharacter()),
            'startingMove' => $this->buildMove($sequence->getStartingMove()),
        ];
    }

    /** @return array<string, mixed> */
    public function buildDetail(BlockstringSequence $sequence): array
    {
        return $this->buildSummary($sequence) + [
            'blocks' => array_values(array_map(fn (BlockstringBlock $block): array => $this->buildBlock($sequence, $block), $sequence->getBlocks()->toArray())),
        ];
    }

    /** @return array<string, mixed> */
    private function buildBlock(BlockstringSequence $sequence, BlockstringBlock $block): array
    {
        $nodes = array_filter($sequence->getSteps()->toArray(), static fn (BlockstringSequenceStep $node): bool => $node->getBlock() === $block);
        $edges = array_filter($sequence->getEdges()->toArray(), static fn (BlockstringEdge $edge): bool => $edge->getFromStep()?->getBlock() === $block);

        return [
            'id' => $block->getId(),
            'description' => $block->getDescription(),
            'nodes' => array_values(array_map(fn (BlockstringSequenceStep $node): array => $this->buildNode($node), $nodes)),
            'edges' => array_values(array_map(fn (BlockstringEdge $edge): array => $this->buildEdge($edge), $edges)),
        ];
    }

    /** @return array<string, mixed>|null */
    private function buildCharacter(?Character $character): ?array
    {
        return $character instanceof Character ? ['id' => (string) $character->getId(), 'name' => $character->getName()] : null;
    }

    /** @return array<string, mixed>|null */
    private function buildMove(?Move $move): ?array
    {
        return $move instanceof Move ? [
            'id' => (string) $move->getId(),
            'numpadNotation' => $move->getNumpadNotation(),
            'commonName' => $move->getCommonName(),
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
            'frameAdvantage' => $node->getFrameAdvantage(),
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
            'trueBlockstring' => $edge->isTrueBlockstring(),
            'gapFrames' => $edge->getGapFrames(),
        ];
    }
}
