<?php declare(strict_types=1);

namespace App\Service;

class RequirementSpecificCharacterCatalog
{
    /**
     * @var array<string, array{status_type: 'integer'|'boolean', max_status: int|null}>
     */
    private const DEFINITIONS = [
        'Drinks' => ['status_type' => 'integer', 'max_status' => 4],
        'Medals' => ['status_type' => 'integer', 'max_status' => 5],
        'Sumo Spirit' => ['status_type' => 'boolean', 'max_status' => null],
        'Poison' => ['status_type' => 'boolean', 'max_status' => null],
        'Bomb' => ['status_type' => 'boolean', 'max_status' => null],
        'Fire Fans' => ['status_type' => 'integer', 'max_status' => 5],
        'Wind Charge' => ['status_type' => 'integer', 'max_status' => 3],
        'Fuha' => ['status_type' => 'integer', 'max_status' => 3],
        "Bushin Ninjastar Cypher (Kim's Level 3)" => ['status_type' => 'boolean', 'max_status' => null],
        'Denjin Charge' => ['status_type' => 'boolean', 'max_status' => null],
    ];

    /**
     * @return array<int, array{name: string, status_type: 'integer'|'boolean', max_status: int|null}>
     */
    public function listForApi(): array
    {
        $result = [];

        foreach (self::DEFINITIONS as $name => $definition) {
            $result[] = [
                'name' => $name,
                'status_type' => $definition['status_type'],
                'max_status' => $definition['max_status'],
            ];
        }

        return $result;
    }

    public function normalizeObjectName(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $trimmedValue = trim($value);

        return '' === $trimmedValue ? null : $trimmedValue;
    }

    public function supportsObject(string $name): bool
    {
        return isset(self::DEFINITIONS[$name]);
    }

    public function statusType(string $name): string
    {
        return self::DEFINITIONS[$name]['status_type'];
    }

    public function maxStatus(string $name): ?int
    {
        return self::DEFINITIONS[$name]['max_status'];
    }

    public function normalizeStatusRequired(string $objectName, mixed $statusRequired): ?string
    {
        if (!$this->supportsObject($objectName)) {
            throw new \InvalidArgumentException(sprintf('Unsupported requirement_specific_character.object_name: %s', $objectName));
        }

        $statusType = $this->statusType($objectName);

        if ('integer' === $statusType) {
            if (is_string($statusRequired) && '' === trim($statusRequired)) {
                return null;
            }

            if (is_string($statusRequired)) {
                if (!preg_match('/^\d+$/', trim($statusRequired))) {
                    throw new \InvalidArgumentException(sprintf('%s requires an integer status_required value.', $objectName));
                }

                $statusRequired = (int) trim($statusRequired);
            }

            if (!is_int($statusRequired)) {
                throw new \InvalidArgumentException(sprintf('%s requires an integer status_required value.', $objectName));
            }

            $maxStatus = $this->maxStatus($objectName);
            if (null !== $maxStatus && ($statusRequired < 1 || $statusRequired > $maxStatus)) {
                throw new \InvalidArgumentException(sprintf('%s status_required must be between 1 and %d.', $objectName, $maxStatus));
            }

            return (string) $statusRequired;
        }

        if (null === $statusRequired) {
            return null;
        }

        if (is_string($statusRequired)) {
            $normalizedValue = strtolower(trim($statusRequired));
            if ('' === $normalizedValue) {
                return null;
            }

            if (in_array($normalizedValue, ['true', '1', 'yes'], true)) {
                return 'true';
            }

            throw new \InvalidArgumentException(sprintf('%s requires a boolean status_required value.', $objectName));
        }

        if (true === $statusRequired || 1 === $statusRequired) {
            return 'true';
        }

        throw new \InvalidArgumentException(sprintf('%s requires a boolean status_required value.', $objectName));
    }
}
