<?php declare(strict_types=1);

namespace App\Service;

use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class ScenarioResourceContextService
{
    /**
     * @param array<string, mixed> $payload
     *
     * @return array{attacker:array{health:float,drive:float,super:float,objectStatuses:array<string,string>},defender:array{health:float,drive:float,super:float,objectStatuses:array<string,string>}}|null
     */
    public function parseOptional(array $payload): ?array
    {
        if (!array_key_exists('resourceContext', $payload)) {
            return null;
        }

        $context = $payload['resourceContext'];
        if (!is_array($context)) {
            throw new BadRequestHttpException('resourceContext must be an object.');
        }

        return [
            'attacker' => $this->parsePlayerResources($context['attacker'] ?? null, 'resourceContext.attacker'),
            'defender' => $this->parsePlayerResources($context['defender'] ?? null, 'resourceContext.defender'),
        ];
    }

    /**
     * @return array{health:float,drive:float,super:float,objectStatuses:array<string,string>}
     */
    private function parsePlayerResources(mixed $value, string $path): array
    {
        if (!is_array($value)) {
            throw new BadRequestHttpException(sprintf('%s must be an object.', $path));
        }

        return [
            'health' => $this->parseNonNegativeNumber($value['health'] ?? null, sprintf('%s.health', $path)),
            'drive' => $this->parseNonNegativeNumber($value['drive'] ?? null, sprintf('%s.drive', $path)),
            'super' => $this->parseNonNegativeNumber($value['super'] ?? null, sprintf('%s.super', $path)),
            'objectStatuses' => $this->parseObjectStatuses($value['objectStatuses'] ?? [], sprintf('%s.objectStatuses', $path)),
        ];
    }

    /** @return array<string,string> */
    private function parseObjectStatuses(mixed $value, string $path): array
    {
        if (null === $value) {
            return [];
        }

        if (!is_array($value)) {
            throw new BadRequestHttpException(sprintf('%s must be an object.', $path));
        }

        $statuses = [];
        foreach ($value as $objectName => $statusValue) {
            if (!is_string($objectName) || '' === trim($objectName)) {
                throw new BadRequestHttpException(sprintf('%s keys must be non-empty strings.', $path));
            }

            if (is_bool($statusValue)) {
                $statuses[trim($objectName)] = $statusValue ? 'true' : 'false';
                continue;
            }

            if (is_int($statusValue) || is_float($statusValue)) {
                if ((float) $statusValue < 0) {
                    throw new BadRequestHttpException(sprintf('%s.%s must be non-negative.', $path, $objectName));
                }
                $statuses[trim($objectName)] = (string) $statusValue;
                continue;
            }

            if (is_string($statusValue)) {
                $trimmedStatus = trim($statusValue);
                if ('' !== $trimmedStatus) {
                    $statuses[trim($objectName)] = $trimmedStatus;
                }
                continue;
            }

            throw new BadRequestHttpException(sprintf('%s.%s must be a boolean, number, or string.', $path, $objectName));
        }

        return $statuses;
    }

    private function parseNonNegativeNumber(mixed $value, string $path): float
    {
        if (!is_int($value) && !is_float($value)) {
            throw new BadRequestHttpException(sprintf('%s must be a non-negative number.', $path));
        }

        $numeric = (float) $value;
        if ($numeric < 0) {
            throw new BadRequestHttpException(sprintf('%s must be a non-negative number.', $path));
        }

        return $numeric;
    }
}
