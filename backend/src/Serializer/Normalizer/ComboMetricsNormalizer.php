<?php declare(strict_types=1);

namespace App\Serializer\Normalizer;

use App\Entity\ComboMetrics;
use App\Util\Enum\ComboExecutionMode;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;
use Symfony\Component\Serializer\Exception\InvalidArgumentException;

class ComboMetricsNormalizer implements NormalizerInterface
{
    public function normalize(mixed $object, ?string $format = null, array $context = []): array
    {
        if (!$object instanceof ComboMetrics) {
            throw new InvalidArgumentException('Expected ComboMetrics object.');
        }

        $mode = $context[ComboExecutionMode::class] ?? ComboExecutionMode::CLASSIC;
        $damage = $object->getDamageFor($mode);

        return [
            'id' => $object->getId(),
            'damage' => $damage,
            'difficultyLevel' => $object->getDifficultyLevel(),
            'driveCost' => $object->getDriveCost(),
            'driveGain' => $object->getDriveGain(),
            'minimumDriveCost' => $object->getMinimumDriveCost(),
            'minimumDriveCostNoBurnout' => $object->getMinimumDriveCostNoBurnout(),
            'superCost' => $object->getSuperCost(),
            'superGain' => $object->getSuperGain(),
            'resourceAdjustedDamage' => $this->resourceAdjustedDamage($object, $damage),
            'sequence_id' => $object->getSequence()?->getId(),
        ];
    }

    /** The resource adjustment is linear in damage, so the active mode's damage shifts it by the same amount. */
    private function resourceAdjustedDamage(ComboMetrics $metrics, ?int $damage): ?float
    {
        $adjusted = $metrics->getResourceAdjustedDamage();
        if (null === $adjusted || null === $damage || null === $metrics->getDamage()) {
            return null === $damage ? null : $adjusted;
        }

        return $adjusted + $damage - $metrics->getDamage();
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
