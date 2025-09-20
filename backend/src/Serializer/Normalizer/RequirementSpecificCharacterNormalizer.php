<?php declare(strict_types=1);

namespace App\Serializer\Normalizer;

use App\Entity\RequirementSpecificCharacter;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class RequirementSpecificCharacterNormalizer implements NormalizerInterface
{
    public function normalize(mixed $object, ?string $format = null, array $context = []): array
    {
        /** @var RequirementSpecificCharacter $object */
        return [
            'id' => $object->getId(),
            'character' => $object->getCharacter() ? [
                'id' => $object->getCharacter()->getId(),
                'name' => $object->getCharacter()->getName(),
            ] : null,
        ];
    }

    public function supportsNormalization(mixed $data, ?string $format = null, array $context = []): bool
    {
        return $data instanceof RequirementSpecificCharacter;
    }

    public function getSupportedTypes(?string $format): array
    {
        return [
            RequirementSpecificCharacter::class => true,
        ];
    }
}
