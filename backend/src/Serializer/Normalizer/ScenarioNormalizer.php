<?php declare(strict_types=1);

namespace App\Serializer\Normalizer;

use App\Entity\Scenario;
use App\Entity\ScenarioLayer;
use App\Entity\ScenarioOption;
use App\Entity\ScenarioOptionRelationships;
use Symfony\Component\Serializer\Normalizer\NormalizerAwareInterface;
use Symfony\Component\Serializer\Normalizer\NormalizerAwareTrait;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class ScenarioNormalizer implements NormalizerInterface, NormalizerAwareInterface
{
    use NormalizerAwareTrait;

    public function normalize(mixed $object, ?string $format = null, array $context = []): array
    {
        /** @var Scenario $object */
        return [
            'id' => $object->getId(),
            'name' => $object->getName(),
            'type' => $object->getType()?->getName(),
            'layers' => $object->getLayers()->map(function (ScenarioLayer $layer) use ($format, $context) {
                return [
                    'id' => $layer->getId(),
                    'index' => $layer->getIndex(),
                    'firstPlayerOptions' => $layer->getFirstPlayerOptions()->map(function (ScenarioOption $option) use ($format, $context) {
                        return $this->normalizeOption($option, $format, $context);
                    })->toArray(),
                    'secondPlayerOptions' => $layer->getSecondPlayerOptions()->map(function (ScenarioOption $option) use ($format, $context) {
                        return $this->normalizeOption($option, $format, $context);
                    })->toArray(),
                ];
            })->toArray(),
        ];
    }

    private function normalizeOption(ScenarioOption $option, ?string $format, array $context): array
    {
        return [
            'id' => $option->getId(),
            'parts' => $option->getScenarioOptionRelationships()->map(function (ScenarioOptionRelationships $rel) use ($format, $context) {
                $part = $rel->getMove();
                return [
                    'id' => $rel->getId(),
                    'index' => $rel->getIndex(),
                    'move' => $part?->getMove() ? $this->normalizer->normalize($part->getMove(), $format, $context) : null,
                    'framesOfDuration' => $part?->getFramesOfDuration(),
                ];
            })->toArray(),
        ];
    }

    public function supportsNormalization(mixed $data, ?string $format = null, array $context = []): bool
    {
        return $data instanceof Scenario;
    }

    public function getSupportedTypes(?string $format): array
    {
        return [
            Scenario::class => true,
        ];
    }
}
