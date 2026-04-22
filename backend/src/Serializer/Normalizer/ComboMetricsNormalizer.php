<?php declare(strict_types=1);

namespace App\Serializer\Normalizer;

use App\Entity\ComboMetrics;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;
use Symfony\Component\Serializer\Exception\InvalidArgumentException;

class ComboMetricsNormalizer implements NormalizerInterface
{
    public function normalize(mixed $object, ?string $format = null, array $context = []): array
    {
        if (!$object instanceof ComboMetrics) {
            throw new InvalidArgumentException('Expected ComboMetrics object.');
        }

        return [
            'id' => $object->getId(),
            'damage' => $object->getDamage(),
            'difficultyLevel' => $object->getDifficultyLevel(),
            'sequence_id' => $object->getSequence()?->getId(),
        ];
    }

    public function supportsNormalization(mixed $data, ?string $format = null, array $context = []): bool
    {
        return $data instanceof ComboMetrics;
    }

    public function getSupportedTypes(?string $format): array
    {
        return [
            ComboMetrics::class => true,
        ];
    }
}
