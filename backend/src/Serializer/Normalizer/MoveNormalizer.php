<?php declare(strict_types=1);

namespace App\Serializer\Normalizer;

use App\Entity\Move;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class MoveNormalizer implements NormalizerInterface
{
    public function normalize(mixed $object, ?string $format = null, array $context = []): array
    {
        /** @var Move $object */
        return [
            'id' => $object->getId(),
            'name' => $object->getName(),
            'numpadNotation' => $object->getNumpadNotation(),
            'character' => $object->getCharacter() ? [
                'id' => $object->getCharacter()->getId(),
                'name' => $object->getCharacter()->getName(),
            ] : null,
        ];
    }

    public function supportsNormalization(mixed $data, ?string $format = null, array $context = []): bool
    {
        return $data instanceof Move;
    }

    public function getSupportedTypes(?string $format): array
    {
        return [
            Move::class => true,
        ];
    }
}
