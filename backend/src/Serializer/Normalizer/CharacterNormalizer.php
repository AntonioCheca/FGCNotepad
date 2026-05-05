<?php declare(strict_types=1);

namespace App\Serializer\Normalizer;

use App\Entity\Character;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class CharacterNormalizer implements NormalizerInterface
{
    public function normalize(mixed $object, ?string $format = null, array $context = []): array
    {
        /** @var Character $object */
        $id = $object->getId();

        return [
            'id' => $id?->toRfc4122(),
            'name' => $object->getName(),
            'life' => $object->getLife(),
        ];
    }

    public function supportsNormalization(mixed $data, ?string $format = null, array $context = []): bool
    {
        return $data instanceof Character;
    }

    public function getSupportedTypes(?string $format): array
    {
        return [
            Character::class => true,
        ];
    }
}
