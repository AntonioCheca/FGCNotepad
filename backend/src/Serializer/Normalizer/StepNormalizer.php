<?php declare(strict_types=1);

namespace App\Serializer\Normalizer;

use App\Entity\Step;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class StepNormalizer implements NormalizerInterface
{
    public function normalize(mixed $object, ?string $format = null, array $context = []): array
    {
        /** @var Step $object */
        return [
            'id' => $object->getId(),
            'name' => $object->getName(),
            'stepOrder' => $object->getStepOrder(),
        ];
    }

    public function supportsNormalization(mixed $data, ?string $format = null, array $context = []): bool
    {
        return $data instanceof Step;
    }

    public function getSupportedTypes(?string $format): array
    {
        return [
            Step::class => true,
        ];
    }
}
