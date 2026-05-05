<?php declare(strict_types=1);

namespace App\Serializer\Normalizer;

use App\Entity\Visibility;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class VisibilityNormalizer implements NormalizerInterface
{
    /**
     * @param array<string, mixed> $context
     * @return array<string, int|string|null>
     */
    public function normalize(mixed $object, ?string $format = null, array $context = []): array
    {
        /** @var Visibility $object */
        return [
            'id' => $object->getId(),
            'name' => $object->getName(),
        ];
    }

    /** @param array<string, mixed> $context */
    public function supportsNormalization(mixed $data, ?string $format = null, array $context = []): bool
    {
        return $data instanceof Visibility;
    }

    /** @return array<class-string, bool> */
    public function getSupportedTypes(?string $format): array
    {
        return [
            Visibility::class => true,
        ];
    }
}
