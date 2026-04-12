<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Scenario;

class ScenarioResponseBuilder
{
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
            'type' => [
                'name' => $scenario->getType()?->getName(),
            ],
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
            'type' => [
                'name' => $scenario->getType()?->getName(),
            ],
            'payload' => $scenario->getPayload(),
            'createdAt' => $scenario->getCreatedAt()->format(DATE_ATOM),
            'updatedAt' => $scenario->getUpdatedAt()->format(DATE_ATOM),
            'author' => $scenario->getAuthor()?->getUsername(),
        ];
    }
}
