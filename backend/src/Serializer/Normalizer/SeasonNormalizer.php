<?php declare(strict_types=1);

namespace App\Serializer\Normalizer;

use App\Entity\Season;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class SeasonNormalizer implements NormalizerInterface
{
    public function normalize(mixed $object, ?string $format = null, array $context = []): array
    {
        /** @var Season $object */
        return [
            'id' => $object->getId(),
            'name' => $object->getName(),
            'startDate' => $object->getStartDate()?->format('Y-m-d'),
            'endDate' => $object->getEndDate()?->format('Y-m-d'),
        ];
    }

    public function supportsNormalization(mixed $data, ?string $format = null, array $context = []): bool
    {
        return $data instanceof Season;
    }

    public function getSupportedTypes(?string $format): array
    {
        return [
            Season::class => true,
        ];
    }
}
