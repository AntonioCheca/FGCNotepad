<?php declare(strict_types=1);

namespace App\Service;

class CharacterObjectCatalog
{
    /**
     * @var array<string, array{character_name: string, name: string, status_type: 'integer'|'boolean', max_status: int|null, can_be_consumed: bool, can_be_added_relative: bool, can_be_added_absolute: bool}>
     */
    private const DEFINITIONS = [
        'jamie_drinks' => ['character_name' => 'Jamie', 'name' => 'Drinks', 'status_type' => 'integer', 'max_status' => 4, 'can_be_consumed' => false, 'can_be_added_relative' => true, 'can_be_added_absolute' => false],
        'manon_medals' => ['character_name' => 'Manon', 'name' => 'Medals', 'status_type' => 'integer', 'max_status' => 5, 'can_be_consumed' => false, 'can_be_added_relative' => true, 'can_be_added_absolute' => false],
        'ehonda_sumo_spirit' => ['character_name' => 'E. Honda', 'name' => 'Sumo Spirit', 'status_type' => 'boolean', 'max_status' => null, 'can_be_consumed' => true, 'can_be_added_relative' => true, 'can_be_added_absolute' => false],
        'aki_poison' => ['character_name' => 'A.K.I.', 'name' => 'Poison', 'status_type' => 'boolean', 'max_status' => null, 'can_be_consumed' => true, 'can_be_added_relative' => true, 'can_be_added_absolute' => false],
        'bison_bomb' => ['character_name' => 'M. Bison', 'name' => 'Bomb', 'status_type' => 'boolean', 'max_status' => null, 'can_be_consumed' => true, 'can_be_added_relative' => true, 'can_be_added_absolute' => false],
        'mai_fire_fans' => ['character_name' => 'Mai', 'name' => 'Fire Fans', 'status_type' => 'integer', 'max_status' => 5, 'can_be_consumed' => true, 'can_be_added_relative' => false, 'can_be_added_absolute' => true],
        'rashid_wind_charge' => ['character_name' => 'Rashid', 'name' => 'Wind Charge', 'status_type' => 'integer', 'max_status' => 3, 'can_be_consumed' => true, 'can_be_added_relative' => true, 'can_be_added_absolute' => false],
        'juri_fuha' => ['character_name' => 'Juri', 'name' => 'Fuha', 'status_type' => 'integer', 'max_status' => 3, 'can_be_consumed' => true, 'can_be_added_relative' => true, 'can_be_added_absolute' => false],
        'kimberly_install' => ['character_name' => 'Kimberly', 'name' => 'Install', 'status_type' => 'boolean', 'max_status' => null, 'can_be_consumed' => false, 'can_be_added_relative' => true, 'can_be_added_absolute' => false],
        'kimberly_spray_cans' => ['character_name' => 'Kimberly', 'name' => 'Spray Cans', 'status_type' => 'integer', 'max_status' => 2, 'can_be_consumed' => true, 'can_be_added_relative' => false, 'can_be_added_absolute' => true],
        'ryu_denjin_charge' => ['character_name' => 'Ryu', 'name' => 'Denjin Charge', 'status_type' => 'boolean', 'max_status' => null, 'can_be_consumed' => true, 'can_be_added_relative' => true, 'can_be_added_absolute' => false],
        'viper_install' => ['character_name' => 'C. Viper', 'name' => 'Install', 'status_type' => 'boolean', 'max_status' => null, 'can_be_consumed' => false, 'can_be_added_relative' => true, 'can_be_added_absolute' => false],
    ];

    /** @return array<int, array<string, mixed>> */
    public function listForApi(?string $characterName = null): array
    {
        $result = [];
        foreach (self::DEFINITIONS as $objectKey => $definition) {
            if (null !== $characterName && 0 !== strcasecmp($characterName, $definition['character_name'])) {
                continue;
            }

            $result[] = $this->definitionForApi($objectKey, $definition);
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
        return null !== $this->definition($objectKeyOrName);
    }

    public function objectKeyFor(string $objectKeyOrName, ?string $characterName = null): ?string
    {
        if (isset(self::DEFINITIONS[$objectKeyOrName])) {
            return $objectKeyOrName;
        }

        foreach (self::DEFINITIONS as $objectKey => $definition) {
            if (0 !== strcasecmp($objectKeyOrName, $definition['name'])) {
                continue;
            }

            if (null === $characterName || 0 === strcasecmp($characterName, $definition['character_name'])) {
                return $objectKey;
            }
        }

        return null;
    }

    /** @return array<string, mixed>|null */
    public function definition(string $objectKeyOrName, ?string $characterName = null): ?array
    {
        $objectKey = $this->objectKeyFor($objectKeyOrName, $characterName);
        if (null === $objectKey) {
            return null;
        }

        return ['object_key' => $objectKey] + self::DEFINITIONS[$objectKey];
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

    /** @param array<string, mixed> $definition */
    private function definitionForApi(string $objectKey, array $definition): array
    {
        return [
            'object_key' => $objectKey,
            'name' => $definition['name'],
            'character_name' => $definition['character_name'],
            'display_name' => sprintf('%s - %s', $definition['character_name'], $definition['name']),
            'status_type' => $definition['status_type'],
            'max_status' => $definition['max_status'],
            'can_be_consumed' => $definition['can_be_consumed'],
            'can_be_added_relative' => $definition['can_be_added_relative'],
            'can_be_added_absolute' => $definition['can_be_added_absolute'],
        ];
    }
}
