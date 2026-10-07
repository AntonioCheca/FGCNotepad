<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\BlockstringBlock;
use App\Entity\BlockstringEdge;
use App\Entity\BlockstringSequence;
use App\Entity\BlockstringSequenceStep;
use App\Entity\Character;
use App\Entity\Move;
use App\Service\PressureGraph\PressureGraphFieldParser;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Uid\Uuid;

/**
 * Writes a blockstring: ordered blocks, each a small graph of moves (nodes) and directed edges between them.
 */
class BlockstringMutationService
{
    private const MAX_BLOCKS = 12;
    private const MAX_NODES_PER_BLOCK = 24;
    private const DESCRIPTION_MAX_LENGTH = 500;
    private const FRAME_ADVANTAGE_LIMIT = 99;

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly PressureGraphFieldParser $graphFields,
    ) {
    }

    /** @param array<string, mixed> $payload */
    public function hydrate(BlockstringSequence $sequence, array $payload): void
    {
        $attacker = $this->findCharacter($this->requiredString($payload, 'attackerCharacterId'));
        $startingMove = $this->findMove($this->requiredString($payload, 'startingMoveId'));
        $this->assertMoveBelongsToCharacter($startingMove, $attacker, 'startingMoveId');
        $sequence
            ->setTitle($this->requiredString($payload, 'title'))
            ->setAttackerCharacter($attacker)
            ->setStartingMove($startingMove);

        $this->clearBlocks($sequence);
        $blocksPayload = $payload['blocks'] ?? null;
        if (!is_array($blocksPayload) || [] === $blocksPayload) {
            throw new BadRequestHttpException('A blockstring needs at least one block.');
        }
        if (count($blocksPayload) > self::MAX_BLOCKS) {
            throw new BadRequestHttpException(sprintf('A blockstring can have at most %d blocks.', self::MAX_BLOCKS));
        }

        $takenClientIds = [];
        $ordinal = 0;
        foreach (array_values($blocksPayload) as $index => $blockPayload) {
            if (!is_array($blockPayload)) {
                throw new BadRequestHttpException('Each block must be an object.');
            }
            $block = (new BlockstringBlock())
                ->setOrdinal($index + 1)
                ->setDescription($this->description($blockPayload['description'] ?? null));
            $sequence->addBlock($block);
            $this->entityManager->persist($block);

            $nodes = $this->addNodes($sequence, $block, $blockPayload['nodes'] ?? null, $attacker, $takenClientIds, $ordinal);
            $this->addEdges($sequence, $blockPayload['edges'] ?? [], $nodes);
        }
    }

    private function clearBlocks(BlockstringSequence $sequence): void
    {
        foreach ([$sequence->getEdges(), $sequence->getSteps(), $sequence->getBlocks()] as $collection) {
            foreach ($collection->toArray() as $item) {
                $collection->removeElement($item);
                $this->entityManager->remove($item);
            }
        }
    }

    /**
     * Node client IDs are unique across the whole blockstring; edges may only join nodes of their own block.
     *
     * @param array<string, true> $takenClientIds
     *
     * @return array<string, BlockstringSequenceStep>
     */
    private function addNodes(BlockstringSequence $sequence, BlockstringBlock $block, mixed $nodesPayload, Character $attacker, array &$takenClientIds, int &$ordinal): array
    {
        if (!is_array($nodesPayload) || [] === $nodesPayload) {
            throw new BadRequestHttpException('Each block needs at least one move.');
        }
        if (count($nodesPayload) > self::MAX_NODES_PER_BLOCK) {
            throw new BadRequestHttpException(sprintf('A block can have at most %d moves.', self::MAX_NODES_PER_BLOCK));
        }

        $nodes = [];
        foreach ($nodesPayload as $nodePayload) {
            if (!is_array($nodePayload)) {
                throw new BadRequestHttpException('Each node must be an object.');
            }
            $clientId = $this->requiredString($nodePayload, 'clientId');
            if (isset($takenClientIds[$clientId])) {
                throw new BadRequestHttpException(sprintf('Duplicate node clientId %s.', $clientId));
            }
            $takenClientIds[$clientId] = true;

            $move = $this->findMove($this->requiredString($nodePayload, 'moveId'));
            $this->assertMoveBelongsToCharacter($move, $attacker, 'node move');
            $node = (new BlockstringSequenceStep())
                ->setBlock($block)
                ->setMove($move)
                ->setOrdinal(++$ordinal)
                ->setFrameAdvantage($this->frameAdvantage($nodePayload['frameAdvantage'] ?? null));
            $sequence->addStep($node);
            $this->entityManager->persist($node);
            $nodes[$clientId] = $node;
        }

        return $nodes;
    }

    /** @param array<string, BlockstringSequenceStep> $nodesByClientId */
    private function addEdges(BlockstringSequence $sequence, mixed $edgesPayload, array $nodesByClientId): void
    {
        if (!is_array($edgesPayload)) {
            throw new BadRequestHttpException('edges must be an array.');
        }

        $edgeKeys = [];
        foreach ($edgesPayload as $edgePayload) {
            if (!is_array($edgePayload)) {
                throw new BadRequestHttpException('Each edge must be an object.');
            }
            $fromId = $this->requiredString($edgePayload, 'from');
            $toId = $this->requiredString($edgePayload, 'to');
            if (!isset($nodesByClientId[$fromId], $nodesByClientId[$toId])) {
                throw new BadRequestHttpException('Edges must connect moves of their own block.');
            }
            if (isset($edgeKeys[$fromId . '>' . $toId])) {
                throw new BadRequestHttpException('Two edges cannot join the same moves.');
            }
            $edgeKeys[$fromId . '>' . $toId] = true;

            $trueBlockstring = true === ($edgePayload['trueBlockstring'] ?? false);
            $gapFrames = $this->gapFrames($edgePayload['gapFrames'] ?? null);
            if ($trueBlockstring && null !== $gapFrames) {
                throw new BadRequestHttpException('An edge is either a true blockstring or has gap frames, not both.');
            }

            $kind = $this->graphFields->edgeKind($edgePayload['kind'] ?? null);
            $edge = (new BlockstringEdge())
                ->setFromStep($nodesByClientId[$fromId])
                ->setToStep($nodesByClientId[$toId])
                ->setKind($kind->value)
                ->setReadLabel($this->graphFields->readLabel($edgePayload['readLabel'] ?? null, $kind))
                ->setTrueBlockstring($trueBlockstring)
                ->setGapFrames($gapFrames);
            $sequence->addEdge($edge);
            $this->entityManager->persist($edge);
        }
    }

    private function description(mixed $value): ?string
    {
        $description = $this->nullableString($value);
        if (null !== $description && mb_strlen($description) > self::DESCRIPTION_MAX_LENGTH) {
            throw new BadRequestHttpException(sprintf('Block description must be at most %d characters.', self::DESCRIPTION_MAX_LENGTH));
        }

        return $description;
    }

    private function frameAdvantage(mixed $value): ?int
    {
        $frames = $this->nullableInt($value, 'frameAdvantage');
        if (null !== $frames && abs($frames) > self::FRAME_ADVANTAGE_LIMIT) {
            throw new BadRequestHttpException(sprintf('frameAdvantage must be between -%1$d and %1$d.', self::FRAME_ADVANTAGE_LIMIT));
        }

        return $frames;
    }

    private function gapFrames(mixed $value): ?int
    {
        $frames = $this->nullableInt($value, 'gapFrames');
        if (null !== $frames && ($frames < 0 || $frames > self::FRAME_ADVANTAGE_LIMIT)) {
            throw new BadRequestHttpException(sprintf('gapFrames must be between 0 and %d.', self::FRAME_ADVANTAGE_LIMIT));
        }

        return $frames;
    }

    /** @param array<mixed> $payload */
    private function requiredString(array $payload, string $key): string
    {
        $value = $this->nullableString($payload[$key] ?? null);
        if (null === $value) {
            throw new BadRequestHttpException(sprintf('%s is required.', $key));
        }

        return $value;
    }

    private function nullableString(mixed $value): ?string
    {
        if (!is_string($value) && !is_int($value)) {
            return null;
        }
        $trimmed = trim((string) $value);

        return '' === $trimmed ? null : $trimmed;
    }

    private function nullableInt(mixed $value, string $field): ?int
    {
        if (null === $value || '' === $value) {
            return null;
        }
        if (is_int($value)) {
            return $value;
        }
        if (is_string($value) && preg_match('/^[+-]?\d+$/', trim($value))) {
            return (int) trim($value);
        }

        throw new BadRequestHttpException(sprintf('%s must be a whole number.', $field));
    }

    private function findCharacter(string $id): Character
    {
        $character = Uuid::isValid($id) ? $this->entityManager->find(Character::class, $id) : null;
        if (!$character instanceof Character) {
            throw new BadRequestHttpException(sprintf('Character %s not found.', $id));
        }

        return $character;
    }

    private function findMove(string $id): Move
    {
        $move = Uuid::isValid($id) ? $this->entityManager->find(Move::class, $id) : null;
        if (!$move instanceof Move) {
            throw new BadRequestHttpException(sprintf('Move %s not found.', $id));
        }

        return $move;
    }

    private function assertMoveBelongsToCharacter(Move $move, Character $character, string $field): void
    {
        if ((string) $move->getCharacter()->getId() === (string) $character->getId()) {
            return;
        }

        throw new BadRequestHttpException(sprintf('%s must belong to the blockstring attacker.', $field));
    }
}
