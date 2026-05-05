<?php declare(strict_types=1);

namespace App\Service;

use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class ScenarioResourceContextService
{
    /**
     * @param array<string, mixed> $payload
     *
     * @return array{attacker:array{health:float,drive:float,super:float},defender:array{health:float,drive:float,super:float}}|null
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
     * @return array{health:float,drive:float,super:float}
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
        ];
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
