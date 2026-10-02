<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\BlockstringCondition;
use App\Entity\BlockstringDefenseEntry;
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
 * Writes a blockstring pressure graph: nodes (moves), directed edges between them, conditions and defense entries.
 */
class BlockstringMutationService
{
    private const MAX_NODES = 24;

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly PressureGraphFieldParser $graphFields,
    ) {
    }

    /** @param array<string, mixed> $payload */
    public function hydrate(BlockstringSequence $sequence, array $payload): void
    {
        $attacker = $this->findCharacter($this->requiredString($payload, 'attackerCharacterId'));
        $sequence
            ->setTitle($this->requiredString($payload, 'title'))
            ->setSummary($this->nullableString($payload['summary'] ?? null))
            ->setClassification($this->allowedString($payload['classification'] ?? 'fake', 'classification', ['true', 'frametrap', 'reset', 'fake', 'knowledge_check']))
            ->setAttackerCharacter($attacker);

        $this->clearGraph($sequence);
        $nodesByClientId = $this->replaceNodes($sequence, $payload['nodes'] ?? null, $attacker);
        $edgesByClientId = $this->replaceEdges($sequence, $payload['edges'] ?? [], $nodesByClientId);
        $this->replaceConditions($sequence, $payload['conditions'] ?? []);
        $this->replaceDefenseEntries($sequence, $payload['defenseEntries'] ?? [], $edgesByClientId);
    }

    private function clearGraph(BlockstringSequence $sequence): void
    {
        foreach ([$sequence->getDefenseEntries(), $sequence->getEdges(), $sequence->getSteps()] as $collection) {
            foreach ($collection->toArray() as $item) {
                $collection->removeElement($item);
                $this->entityManager->remove($item);
            }
        }
    }

    /** @return array<string, BlockstringSequenceStep> */
    private function replaceNodes(BlockstringSequence $sequence, mixed $nodesPayload, Character $attacker): array
    {
        if (!is_array($nodesPayload) || [] === $nodesPayload) {
            throw new BadRequestHttpException('A blockstring needs at least one move.');
        }
        if (count($nodesPayload) > self::MAX_NODES) {
            throw new BadRequestHttpException(sprintf('A blockstring can have at most %d moves.', self::MAX_NODES));
        }

        $nodes = [];
        foreach (array_values($nodesPayload) as $index => $nodePayload) {
            if (!is_array($nodePayload)) {
                throw new BadRequestHttpException('Each node must be an object.');
            }
            $clientId = $this->requiredString($nodePayload, 'clientId');
            if (isset($nodes[$clientId])) {
                throw new BadRequestHttpException(sprintf('Duplicate node clientId %s.', $clientId));
            }

            $move = $this->findMove($this->requiredString($nodePayload, 'moveId'));
            $this->assertMoveBelongsToCharacter($move, $attacker, 'node move');
            $node = (new BlockstringSequenceStep())
                ->setMove($move)
                ->setOrdinal($index + 1)
                ->setLayer($this->graphFields->layer($nodePayload['layer'] ?? null))
                ->setDamageDealt($this->graphFields->damage($nodePayload['damageDealt'] ?? null, 'damageDealt'))
                ->setDamageReceived($this->graphFields->damage($nodePayload['damageReceived'] ?? null, 'damageReceived'));
            $sequence->addStep($node);
            $this->entityManager->persist($node);
            $nodes[$clientId] = $node;
        }

        return $nodes;
    }

    /**
     * @param array<string, BlockstringSequenceStep> $nodesByClientId
     *
     * @return array<string, BlockstringEdge>
     */
    private function replaceEdges(BlockstringSequence $sequence, mixed $edgesPayload, array $nodesByClientId): array
    {
        if (!is_array($edgesPayload)) {
            throw new BadRequestHttpException('edges must be an array.');
        }

        $edges = [];
        foreach ($edgesPayload as $edgePayload) {
            if (!is_array($edgePayload)) {
                throw new BadRequestHttpException('Each edge must be an object.');
            }
            $from = $nodesByClientId[$this->requiredString($edgePayload, 'from')] ?? null;
            $to = $nodesByClientId[$this->requiredString($edgePayload, 'to')] ?? null;
            if (null === $from || null === $to) {
                throw new BadRequestHttpException('Edges must connect existing nodes.');
            }

            $kind = $this->graphFields->edgeKind($edgePayload['kind'] ?? null);
            $edge = (new BlockstringEdge())
                ->setFromStep($from)
                ->setToStep($to)
                ->setKind($kind->value)
                ->setReadLabel($this->graphFields->readLabel($edgePayload['readLabel'] ?? null, $kind))
                ->setLayer($this->graphFields->layer($edgePayload['layer'] ?? null))
                ->setFrameAdvantage($this->nullableInt($edgePayload['frameAdvantage'] ?? null))
                ->setGapFrames($this->nonNegativeInt($edgePayload['gapFrames'] ?? null, 'gapFrames'));
            $sequence->addEdge($edge);
            $this->entityManager->persist($edge);

            $clientId = $this->nullableString($edgePayload['clientId'] ?? null);
            if (null !== $clientId) {
                $edges[$clientId] = $edge;
            }
        }

        return $edges;
    }

    private function replaceConditions(BlockstringSequence $sequence, mixed $conditionsPayload): void
    {
        foreach ($sequence->getConditions()->toArray() as $condition) {
            $sequence->getConditions()->removeElement($condition);
            $this->entityManager->remove($condition);
        }

        if (!is_array($conditionsPayload)) {
            return;
        }

        foreach ($conditionsPayload as $conditionPayload) {
            if (!is_array($conditionPayload)) {
                continue;
            }

            $condition = (new BlockstringCondition())
                ->setKind($this->requiredString($conditionPayload, 'kind'))
                ->setValue($this->requiredString($conditionPayload, 'value'))
                ->setNote($this->nullableString($conditionPayload['note'] ?? null));
            $sequence->addCondition($condition);
            $this->entityManager->persist($condition);
        }
    }

    /** @param array<string, BlockstringEdge> $edgesByClientId */
    private function replaceDefenseEntries(BlockstringSequence $sequence, mixed $entriesPayload, array $edgesByClientId): void
    {
        if (!is_array($entriesPayload)) {
            return;
        }

        foreach ($entriesPayload as $entryPayload) {
            if (!is_array($entryPayload)) {
                continue;
            }

            $edgeClientId = $this->nullableString($entryPayload['edgeClientId'] ?? null);
            if (null === $edgeClientId || !isset($edgesByClientId[$edgeClientId])) {
                throw new BadRequestHttpException('Defense entry must target a blockstring edge.');
            }

            $entry = (new BlockstringDefenseEntry())
                ->setEdge($edgesByClientId[$edgeClientId])
                ->setInstruction($this->nullableString($entryPayload['instruction'] ?? null))
                ->setExceptionNotes($this->nullableString($entryPayload['exceptionNotes'] ?? null))
                ->setDefenderCharacter($this->findNullableCharacter($this->nullableString($entryPayload['defenderCharacterId'] ?? null)))
                ->setMove($this->findNullableMove($this->nullableString($entryPayload['moveId'] ?? null)))
                ->setResponseType($this->allowedString($entryPayload['responseType'] ?? 'button', 'responseType', ['button', 'reversal', 'jump', 'backdash', 'block', 'movement']))
                ->setOutcome($this->allowedString($entryPayload['outcome'] ?? 'counter_hit', 'outcome', ['counter_hit', 'punish_counter', 'trade', 'escape', 'reset_to_neutral', 'block']))
                ->setConversion($this->nullableString($entryPayload['conversion'] ?? null));
            $sequence->addDefenseEntry($entry);
            $this->entityManager->persist($entry);
        }
    }

    /** @param array<mixed> $payload */
    private function requiredString(array $payload, string $key): string
    {
        $value = $payload[$key] ?? null;
        if (!is_string($value) && !is_int($value)) {
            throw new BadRequestHttpException(sprintf('%s is required.', $key));
        }

        $trimmed = trim((string) $value);
        if ('' === $trimmed) {
            throw new BadRequestHttpException(sprintf('%s is required.', $key));
        }

        return $trimmed;
    }

    private function nullableString(mixed $value): ?string
    {
        if (!is_string($value) && !is_int($value)) {
            return null;
        }
        $trimmed = trim((string) $value);

        return '' === $trimmed ? null : $trimmed;
    }

    private function nullableInt(mixed $value): ?int
    {
        if (is_int($value)) {
            return $value;
        }
        if (!is_string($value) || !preg_match('/^-?\d+$/', trim($value))) {
            return null;
        }

        return (int) trim($value);
    }

    private function nonNegativeInt(mixed $value, string $field): ?int
    {
        $int = $this->nullableInt($value);
        if (null !== $int && $int < 0) {
            throw new BadRequestHttpException(sprintf('%s cannot be negative.', $field));
        }

        return $int;
    }

    /** @param list<string> $allowed */
    private function allowedString(mixed $value, string $field, array $allowed): string
    {
        $normalized = is_string($value) ? trim(mb_strtolower($value)) : '';
        if (!in_array($normalized, $allowed, true)) {
            throw new BadRequestHttpException(sprintf('Invalid %s.', $field));
        }

        return $normalized;
    }

    private function findCharacter(string $id): Character
    {
        $character = Uuid::isValid($id) ? $this->entityManager->find(Character::class, $id) : null;
        if (!$character instanceof Character) {
            throw new BadRequestHttpException(sprintf('Character %s not found.', $id));
        }

        return $character;
    }

    private function findNullableCharacter(?string $id): ?Character
    {
        return null === $id ? null : $this->findCharacter($id);
    }

    private function findMove(string $id): Move
    {
        $move = Uuid::isValid($id) ? $this->entityManager->find(Move::class, $id) : null;
        if (!$move instanceof Move) {
            throw new BadRequestHttpException(sprintf('Move %s not found.', $id));
        }

        return $move;
    }

    private function findNullableMove(?string $id): ?Move
    {
        return null === $id ? null : $this->findMove($id);
    }

    private function assertMoveBelongsToCharacter(Move $move, Character $character, string $field): void
    {
        if ((string) $move->getCharacter()->getId() === (string) $character->getId()) {
            return;
        }

        throw new BadRequestHttpException(sprintf('%s must belong to the blockstring attacker.', $field));
    }
}
