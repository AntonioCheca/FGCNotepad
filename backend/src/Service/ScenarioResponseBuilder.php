<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Scenario;

class ScenarioResponseBuilder
{
    public function __construct(
        private readonly ScenarioMatrixMapper $scenarioMatrixMapper,
    ) {
    }

    /**
     * @param list<Scenario> $scenarios
     *
     * @return list<array<string, mixed>>
     */
    public function buildList(array $scenarios): array
    {
        return array_map(fn (Scenario $scenario) => $this->buildListItem($scenario), $scenarios);
    }

    /**
     * @return array<string, mixed>
     */
    public function buildListItem(Scenario $scenario): array
    {
        return [
            'id' => $scenario->getPublicId()->toRfc4122(),
            'name' => $scenario->getName(),
            'label' => $scenario->getName(),
            'scenarioType' => $scenario->getScenarioType(),
            'typeLabel' => $this->toTypeLabel($scenario->getScenarioType()),
            'defenderCharacterId' => $scenario->getDefenderCharacter()?->getId()?->toRfc4122(),
            'defenderCharacterName' => $scenario->getDefenderCharacter()?->getName(),
            'defenderCharacterLife' => $scenario->getDefenderCharacter()?->getLife(),
            'attackerCharacterId' => $scenario->getAttackerCharacter()?->getId()?->toRfc4122(),
            'attackerCharacterName' => $scenario->getAttackerCharacter()?->getName(),
            'attackerCharacterLife' => $scenario->getAttackerCharacter()?->getLife(),
            'triggerMoveId' => $scenario->getTriggerMove()?->getId()?->toRfc4122(),
            'triggerMoveLabel' => $scenario->getTriggerMove()?->getName(),
            'updatedAt' => $scenario->getUpdatedAt()->format(DATE_ATOM),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function buildDetail(Scenario $scenario): array
    {
        return [
            'id' => $scenario->getPublicId()->toRfc4122(),
            'name' => $scenario->getName(),
            'searchLabel' => $scenario->getSearchLabel(),
            'scenarioType' => $scenario->getScenarioType(),
            'typeLabel' => $this->toTypeLabel($scenario->getScenarioType()),
            'defenderCharacterId' => $scenario->getDefenderCharacter()?->getId()?->toRfc4122(),
            'defenderCharacterName' => $scenario->getDefenderCharacter()?->getName(),
            'defenderCharacterLife' => $scenario->getDefenderCharacter()?->getLife(),
            'attackerCharacterId' => $scenario->getAttackerCharacter()?->getId()?->toRfc4122(),
            'attackerCharacterName' => $scenario->getAttackerCharacter()?->getName(),
            'attackerCharacterLife' => $scenario->getAttackerCharacter()?->getLife(),
            'triggerMoveId' => $scenario->getTriggerMove()?->getId()?->toRfc4122(),
            'triggerMoveLabel' => $scenario->getTriggerMove()?->getName(),
            'matrix' => $this->scenarioMatrixMapper->buildMatrixPayload($scenario),
            'createdAt' => $scenario->getCreatedAt()->format(DATE_ATOM),
            'updatedAt' => $scenario->getUpdatedAt()->format(DATE_ATOM),
            'author' => $scenario->getAuthor()?->getUsername(),
        ];
    }

    private function toTypeLabel(string $scenarioType): string
    {
        $normalized = trim(mb_strtolower($scenarioType));

        if ('aggregated_oki' === $normalized) {
            return 'Aggregated Oki';
        }

        return ucfirst($normalized);
    }
}
