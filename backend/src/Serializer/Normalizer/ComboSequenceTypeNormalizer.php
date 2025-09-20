<?php declare(strict_types=1);

namespace App\Serializer\Normalizer;

use App\Entity\ComboSequenceType;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class ComboSequenceTypeNormalizer implements NormalizerInterface
{
    public function normalize(mixed $object, ?string $format = null, array $context = []): array
    {
        /** @var ComboSequenceType $object */
        return [
            'id' => $object->getId(),
            'name' => $object->getName(),
        ];
    }

    public function supportsNormalization(mixed $data, ?string $format = null, array $context = []): bool
    {
        return $data instanceof ComboSequenceType;
    }

    public function getSupportedTypes(?string $format): array
    {
        return [
            ComboSequenceType::class => true,
        ];
    }
}
