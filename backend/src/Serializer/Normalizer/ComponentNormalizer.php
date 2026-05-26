<?php declare(strict_types=1);

namespace App\Serializer\Normalizer;

use App\Entity\Component;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class ComponentNormalizer implements NormalizerInterface
{
    public function normalize(mixed $object, ?string $format = null, array $context = []): array
    {
        /** @var Component $object */
        return [
            'id' => $object->getId(),
            'type' => strtolower((new \ReflectionClass($object))->getShortName()),
        ];
    }

    public function supportsNormalization(mixed $data, ?string $format = null, array $context = []): bool
    {
        return $data instanceof Component;
    }

    public function getSupportedTypes(?string $format): array
    {
        return [
            Component::class => true,
        ];
    }
}
