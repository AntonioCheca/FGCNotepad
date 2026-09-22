<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\CharacterObject;
use App\Entity\Move;
use App\Entity\MoveResourceEffect;
use App\Entity\User;
use App\Repository\CharacterObjectRepository;
use App\Repository\MoveResourceEffectRepository;
use Doctrine\ORM\EntityManagerInterface;

class MoveResourceEffectService
{
    public function __construct(
        private readonly MoveResourceEffectRepository $effectRepository,
        private readonly CharacterObjectRepository $resourceRepository,
        private readonly ComboResourceLedgerService $ledgerService,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * Replaces a move's effects with the given list (a resource missing from the list has no effect any more).
     *
     * @param list<mixed> $effects each {resourceId:int, mode:'relative'|'set', amount:int}
     *
     * @return list<MoveResourceEffect>
     *
     * @throws \InvalidArgumentException when an entry is invalid
     */
    public function replaceEffects(Move $move, array $effects, User $actor): array
    {
        $wanted = [];
        foreach ($effects as $index => $entry) {
            if (!is_array($entry)) {
                throw new \InvalidArgumentException(sprintf('effects[%d] must be an object.', $index));
            }

            $resource = is_int($entry['resourceId'] ?? null) ? $this->resourceRepository->find($entry['resourceId']) : null;
            if (!$resource instanceof CharacterObject || $resource->getCharacter()?->getId()?->toRfc4122() !== $move->getCharacter()->getId()?->toRfc4122()) {
                throw new \InvalidArgumentException(sprintf('effects[%d].resourceId must be a resource of %s.', $index, $move->getCharacter()->getName()));
            }

            $mode = (string) ($entry['mode'] ?? MoveResourceEffect::MODE_RELATIVE);
            if (!in_array($mode, [MoveResourceEffect::MODE_RELATIVE, MoveResourceEffect::MODE_SET], true)) {
                throw new \InvalidArgumentException(sprintf('effects[%d].mode must be relative or set.', $index));
            }

            $amount = $entry['amount'] ?? null;
            if (!is_int($amount) || (MoveResourceEffect::MODE_RELATIVE === $mode && 0 === $amount) || (MoveResourceEffect::MODE_SET === $mode && $amount < 0)) {
                throw new \InvalidArgumentException(sprintf('effects[%d].amount must be a non-zero integer (relative) or a non-negative integer (set).', $index));
            }

            $wanted[(int) $resource->getId()] = [$resource, $mode, $amount];
        }

        $saved = [];
        foreach ($this->effectRepository->findBy(['move' => $move]) as $existing) {
            $resourceId = (int) $existing->getCharacterObject()->getId();
            if (!isset($wanted[$resourceId])) {
                $this->entityManager->remove($existing);
                continue;
            }
            [, $mode, $amount] = $wanted[$resourceId];
            $existing->setMode($mode)->setAmount($amount)->setSource(MoveResourceEffect::SOURCE_MANUAL)->setEditedBy($actor);
            $saved[] = $existing;
            unset($wanted[$resourceId]);
        }

        foreach ($wanted as [$resource, $mode, $amount]) {
            $effect = (new MoveResourceEffect())->setMove($move)->setCharacterObject($resource)->setMode($mode)->setAmount($amount)->setSource(MoveResourceEffect::SOURCE_MANUAL)->setEditedBy($actor);
            $this->entityManager->persist($effect);
            $saved[] = $effect;
        }

        $this->entityManager->flush();
        $this->ledgerService->syncCombosContainingMove($move);
        $this->entityManager->flush();

        return $saved;
    }

    /** @return array<string, mixed> */
    public function toApi(MoveResourceEffect $effect): array
    {
        return [
            'resourceId' => $effect->getCharacterObject()->getId(),
            'resourceName' => $effect->getCharacterObject()->getName(),
            'mode' => $effect->getMode(),
            'amount' => $effect->getAmount(),
            'source' => $effect->getSource(),
            'observationCount' => $effect->getObservationCount(),
        ];
    }
}
