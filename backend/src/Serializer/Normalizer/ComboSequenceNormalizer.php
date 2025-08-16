<?php declare(strict_types=1);

namespace App\Normalizer;

use App\Entity\ComboSequences;
use Symfony\Component\Serializer\Normalizer\ContextAwareNormalizerInterface;
use Symfony\Component\Serializer\Exception\InvalidArgumentException;

class ComboSequencesNormalizer implements ContextAwareNormalizerInterface
{
    public function supportsNormalization($data, string $format = null, array $context = []): bool
    {
        return $data instanceof ComboSequences;
    }

    public function normalize($object, string $format = null, array $context = []): array
    {
        if (!$object instanceof ComboSequences) {
            throw new InvalidArgumentException('Expected ComboSequences object.');
        }

        return [
            'id' => $object->getId(),
            'name' => $object->getName(),
            'description' => $object->getDescription(),
        ];
    }
}
