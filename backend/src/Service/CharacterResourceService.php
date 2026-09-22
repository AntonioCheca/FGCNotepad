<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Character;
use App\Entity\CharacterObject;
use App\Repository\CharacterObjectRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Admin-defined character resources (medals, drinks, spray cans, installs...). Definitions live in the database;
 * nothing here knows about any specific character.
 */
class CharacterResourceService
{
    public function __construct(
        private readonly CharacterObjectRepository $repository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /** @return array<int, array<string, mixed>> */
    public function listForApi(?string $characterName = null): array
    {
        $result = [];
        foreach ($this->repository->findAll() as $resource) {
            if (null !== $characterName && 0 !== strcasecmp($characterName, (string) $resource->getCharacterName())) {
                continue;
            }

            $result[] = $this->toApi($resource);
        }

        usort($result, static fn (array $left, array $right): int => ($left['display_name'] ?? '') <=> ($right['display_name'] ?? ''));

        return $result;
    }

    public function normalizeObjectKey(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $trimmedValue = trim($value);

        return '' === $trimmedValue ? null : $trimmedValue;
    }

    public function normalizeObjectName(mixed $value): ?string
    {
        return $this->normalizeObjectKey($value);
    }

    public function supportsObject(string $objectKeyOrName): bool
    {
        return null !== $this->find($objectKeyOrName);
    }

    public function objectKeyFor(string $objectKeyOrName, ?string $characterName = null): ?string
    {
        return $this->find($objectKeyOrName, $characterName)?->getObjectKey();
    }

    /** @return array<string, mixed>|null */
    public function definition(string $objectKeyOrName, ?string $characterName = null): ?array
    {
        $resource = $this->find($objectKeyOrName, $characterName);

        return null === $resource ? null : $this->toApi($resource);
    }

    public function normalizeStatusValue(string $objectKeyOrName, mixed $statusValue, ?string $fieldName = null): ?string
    {
        $definition = $this->definition($objectKeyOrName);
        if (null === $definition) {
            throw new \InvalidArgumentException(sprintf('Unsupported combo object: %s', $objectKeyOrName));
        }

        if (null === $statusValue) {
            return null;
        }

        if ('integer' === $definition['status_type']) {
            if (is_string($statusValue) && '' === trim($statusValue)) {
                return null;
            }

            if (is_string($statusValue)) {
                if (!preg_match('/^\d+$/', trim($statusValue))) {
                    throw new \InvalidArgumentException(sprintf('%s requires an integer %s value.', $definition['name'], $fieldName ?? 'status'));
                }

                $statusValue = (int) trim($statusValue);
            }

            if (!is_int($statusValue)) {
                throw new \InvalidArgumentException(sprintf('%s requires an integer %s value.', $definition['name'], $fieldName ?? 'status'));
            }

            $maxStatus = $definition['max_status'];
            if (null !== $maxStatus && ($statusValue < 1 || $statusValue > $maxStatus)) {
                throw new \InvalidArgumentException(sprintf('%s %s must be between 1 and %d.', $definition['name'], $fieldName ?? 'status', $maxStatus));
            }

            return (string) $statusValue;
        }

        if (is_string($statusValue)) {
            $normalizedValue = strtolower(trim($statusValue));
            if ('' === $normalizedValue) {
                return null;
            }

            if (in_array($normalizedValue, ['true', '1', 'yes'], true)) {
                return 'true';
            }

            throw new \InvalidArgumentException(sprintf('%s requires a boolean %s value.', $definition['name'], $fieldName ?? 'status'));
        }

        if (true === $statusValue || 1 === $statusValue) {
            return 'true';
        }

        throw new \InvalidArgumentException(sprintf('%s requires a boolean %s value.', $definition['name'], $fieldName ?? 'status'));
    }

    public function normalizeStatusRequired(string $objectKeyOrName, mixed $statusRequired): ?string
    {
        return $this->normalizeStatusValue($objectKeyOrName, $statusRequired, 'status_required');
    }

    /**
     * @param array<string, mixed> $data
     *
     * @throws \InvalidArgumentException when the payload is invalid
     */
    public function save(?CharacterObject $resource, array $data): CharacterObject
    {
        $resource ??= new CharacterObject();

        if (null === $resource->getId() && null === $resource->getCharacter()) {
            $characterId = is_string($data['character_id'] ?? null) ? $data['character_id'] : '';
            $character = '' === $characterId ? null : $this->entityManager->getRepository(Character::class)->find($characterId);
            if (!$character instanceof Character) {
                throw new \InvalidArgumentException('character_id must reference an existing character.');
            }
            $resource->setCharacter($character);
        }

        $name = trim((string) ($data['name'] ?? $resource->getName() ?? ''));
        if ('' === $name) {
            throw new \InvalidArgumentException('name is required.');
        }

        $kind = (string) ($data['kind'] ?? $resource->getKind());
        if (!in_array($kind, CharacterObject::KINDS, true)) {
            throw new \InvalidArgumentException(sprintf('kind must be one of: %s.', implode(', ', CharacterObject::KINDS)));
        }

        $spendBehavior = (string) ($data['spend_behavior'] ?? $resource->getSpendBehavior());
        if (!in_array($spendBehavior, [CharacterObject::SPEND_CONSUMED, CharacterObject::SPEND_MAINTAINED], true)) {
            throw new \InvalidArgumentException('spend_behavior must be consumed or maintained.');
        }

        $extractorSource = (string) ($data['extractor_source'] ?? $resource->getExtractorSource());
        if (!in_array($extractorSource, [CharacterObject::SOURCE_NAMED, CharacterObject::SOURCE_INSTALL], true)) {
            throw new \InvalidArgumentException('extractor_source must be named or install.');
        }

        $isState = CharacterObject::KIND_STATE === $kind;
        $minStatus = $isState ? 0 : $this->intOrDefault($data, 'min_status', $resource->getMinStatus());
        $maxStatus = $isState ? null : $this->nullableInt($data, 'max_status', $resource->getMaxStatus());
        $startsWith = $isState ? min(1, max(0, $this->intOrDefault($data, 'starts_with', $resource->getStartsWith()))) : $this->intOrDefault($data, 'starts_with', $resource->getStartsWith());

        if (null !== $maxStatus && $maxStatus < $minStatus) {
            throw new \InvalidArgumentException('max_status cannot be lower than min_status.');
        }
        if ($startsWith < $minStatus || (null !== $maxStatus && $startsWith > $maxStatus)) {
            throw new \InvalidArgumentException('starts_with must be between min_status and max_status.');
        }

        $extractorKey = array_key_exists('extractor_key', $data) ? trim((string) $data['extractor_key']) : (string) $resource->getExtractorKey();

        $resource
            ->setName($name)
            ->setKind($kind)
            ->setSpendBehavior($spendBehavior)
            ->setStatusType($isState ? 'boolean' : 'integer')
            ->setMinStatus($minStatus)
            ->setMaxStatus($maxStatus)
            ->setStartsWith($startsWith)
            ->setResetsEachRound((bool) ($data['resets_each_round'] ?? $resource->resetsEachRound()))
            ->setExtractorKey('' === $extractorKey ? null : $extractorKey)
            ->setExtractorSource($extractorSource)
            ->setSortOrder($this->intOrDefault($data, 'sort_order', $resource->getSortOrder()))
            ->setCanBeConsumed(CharacterObject::SPEND_CONSUMED === $spendBehavior)
            ->setCanBeAddedRelative(true);

        if (null === $resource->getObjectKey()) {
            $resource->setObjectKey($this->uniqueKey((string) $resource->getCharacterName(), $name));
        }

        $this->entityManager->persist($resource);
        $this->entityManager->flush();

        return $resource;
    }

    public function delete(CharacterObject $resource): void
    {
        $this->entityManager->remove($resource);
        $this->entityManager->flush();
    }

    /** @return array<string, mixed> */
    public function toApi(CharacterObject $resource): array
    {
        return [
            'id' => $resource->getId(),
            'object_key' => $resource->getObjectKey(),
            'name' => $resource->getName(),
            'character_id' => $resource->getCharacter()?->getId()?->toRfc4122(),
            'character_name' => $resource->getCharacterName(),
            'display_name' => sprintf('%s - %s', $resource->getCharacterName(), $resource->getName()),
            'kind' => $resource->getKind(),
            'spend_behavior' => $resource->getSpendBehavior(),
            'starts_with' => $resource->getStartsWith(),
            'resets_each_round' => $resource->resetsEachRound(),
            'min_status' => $resource->getMinStatus(),
            'extractor_key' => $resource->getExtractorKey(),
            'extractor_source' => $resource->getExtractorSource(),
            'sort_order' => $resource->getSortOrder(),
            'status_type' => $resource->getStatusType(),
            'max_status' => $resource->getMaxStatus(),
            'can_be_consumed' => $resource->canBeConsumed(),
            'can_be_added_relative' => $resource->canBeAddedRelative(),
            'can_be_added_absolute' => $resource->canBeAddedAbsolute(),
        ];
    }

    private function find(string $objectKeyOrName, ?string $characterName = null): ?CharacterObject
    {
        $byKey = $this->repository->findOneByKey($objectKeyOrName);
        if ($byKey instanceof CharacterObject) {
            return $byKey;
        }

        foreach ($this->repository->findBy(['name' => $objectKeyOrName]) as $candidate) {
            if (null === $characterName || 0 === strcasecmp($characterName, (string) $candidate->getCharacterName())) {
                return $candidate;
            }
        }

        return null;
    }

    private function uniqueKey(string $characterName, string $name): string
    {
        $base = strtolower(trim((string) preg_replace('/[^a-z0-9]+/i', '_', $characterName . ' ' . $name), '_'));
        $key = $base;
        for ($suffix = 2; null !== $this->repository->findOneByKey($key); ++$suffix) {
            $key = $base . '_' . $suffix;
        }

        return $key;
    }

    /** @param array<string, mixed> $data */
    private function intOrDefault(array $data, string $field, int $default): int
    {
        if (!array_key_exists($field, $data) || null === $data[$field] || '' === $data[$field]) {
            return $default;
        }
        if (!is_numeric($data[$field]) || (int) $data[$field] < 0) {
            throw new \InvalidArgumentException(sprintf('%s must be a non-negative integer.', $field));
        }

        return (int) $data[$field];
    }

    /** @param array<string, mixed> $data */
    private function nullableInt(array $data, string $field, ?int $default): ?int
    {
        if (!array_key_exists($field, $data)) {
            return $default;
        }
        if (null === $data[$field] || '' === $data[$field]) {
            return null;
        }

        return $this->intOrDefault($data, $field, 0);
    }
}
