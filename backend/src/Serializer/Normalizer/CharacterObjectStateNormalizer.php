<?php declare(strict_types=1);

namespace App\Serializer\Normalizer;

use App\Entity\CharacterObjectState;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class CharacterObjectStateNormalizer implements NormalizerInterface
{
    public function normalize(mixed $object, ?string $format = null, array $context = []): array
    {
        /** @var CharacterObjectState $object */
        return [
            'id' => $object->getId(),
            'object_key' => $object->getObjectKey(),
            'character_name' => $object->getCharacterName(),
            'object_name' => $object->getObjectName(),
            'status_required' => $object->getStatusRequired(),
            'consumed' => $object->isConsumed(),
            'added_relative' => $object->getAddedRelative(),
            'added_absolute' => $object->getAddedAbsolute(),
        ];
    }

    public function supportsNormalization(mixed $data, ?string $format = null, array $context = []): bool
    {
        return $data instanceof CharacterObjectState;
    }

    public function getSupportedTypes(?string $format): array
    {
        return [
            CharacterObjectState::class => true,
        ];
    }
}
