<?php declare(strict_types=1);

namespace App\Normalizer;

use App\Entity\ComboMetrics;
use Symfony\Component\Serializer\Normalizer\ContextAwareNormalizerInterface;
use Symfony\Component\Serializer\Exception\InvalidArgumentException;

class ComboMetricsNormalizer implements ContextAwareNormalizerInterface
{
    public function supportsNormalization($data, string $format = null, array $context = []): bool
    {
        return $data instanceof ComboMetrics;
    }

    public function normalize($object, string $format = null, array $context = []): array
    {
        if (!$object instanceof ComboMetrics) {
            throw new InvalidArgumentException('Expected ComboMetrics object.');
        }

        return [
            'id' => $object->getId(),
            'damage' => $object->getDamage(),
            'sequence_id' => $object->getSequence()?->getId(),
        ];
    }
}
