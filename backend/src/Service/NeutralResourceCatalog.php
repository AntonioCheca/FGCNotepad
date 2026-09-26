<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Character;
use App\Entity\CharacterObject;
use App\Repository\CharacterObjectRepository;
use App\Repository\NeutralObservationRepository;

/**
 * The character resources that can filter neutral stats: FGCNotepad resources linked to an extractor key or to the
 * install state. Values are exact states; a resource without a declared maximum offers the values seen in the data.
 */
final class NeutralResourceCatalog
{
    public function __construct(
        private readonly CharacterObjectRepository $characterObjectRepository,
        private readonly NeutralObservationRepository $observationRepository,
    ) {
    }

    /** @return list<array{key: string, label: string, values: list<array{value: int, label: string}>}> */
    public function options(Character $character): array
    {
        $options = [];
        foreach ($this->filterableResources($character) as $resource) {
            $options[] = [
                'key' => (string) $resource->getObjectKey(),
                'label' => (string) $resource->getName(),
                'values' => $this->values($character, $resource),
            ];
        }

        return $options;
    }

    /**
     * Unknown keys are ignored: they belong to a previously selected character.
     *
     * @param array<string, list<int>> $selected object key => accepted values
     *
     * @return list<NeutralResourceCondition>
     */
    public function conditions(Character $character, array $selected, string $side): array
    {
        $conditions = [];
        foreach ($this->filterableResources($character) as $resource) {
            $values = $selected[(string) $resource->getObjectKey()] ?? [];
            if ([] === $values) {
                continue;
            }
            $isInstall = CharacterObject::SOURCE_INSTALL === $resource->getExtractorSource();
            $conditions[] = new NeutralResourceCondition($side, $isInstall ? 'install' : trim((string) $resource->getExtractorKey()), $isInstall, $values);
        }

        return $conditions;
    }

    /** @return list<CharacterObject> */
    private function filterableResources(Character $character): array
    {
        $resources = array_filter(
            $this->characterObjectRepository->findBy(['character' => $character], ['name' => 'ASC']),
            static fn (CharacterObject $resource): bool => CharacterObject::SOURCE_INSTALL === $resource->getExtractorSource()
                || '' !== trim((string) $resource->getExtractorKey()),
        );

        return array_values($resources);
    }

    /** @return list<array{value: int, label: string}> */
    private function values(Character $character, CharacterObject $resource): array
    {
        if (CharacterObject::SOURCE_INSTALL === $resource->getExtractorSource() || 'boolean' === $resource->getStatusType()) {
            return [['value' => 0, 'label' => 'Off'], ['value' => 1, 'label' => 'On']];
        }

        $max = $resource->getMaxStatus()
            ?? $this->observationRepository->maxResourceValue((string) $character->getId(), trim((string) $resource->getExtractorKey()))
            ?? 1;

        return array_map(static fn (int $value): array => ['value' => $value, 'label' => (string) $value], range(0, max(1, $max)));
    }
}
