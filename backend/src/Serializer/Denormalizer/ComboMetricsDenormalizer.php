<?php declare(strict_types=1);

namespace App\Serializer\Denormalizer;

use App\Entity\ComboMetrics;
use App\Repository\ComboSequencesRepository;
use Symfony\Component\Serializer\Exception\NotNormalizableValueException;
use Symfony\Component\Serializer\Normalizer\DenormalizerAwareInterface;
use Symfony\Component\Serializer\Normalizer\DenormalizerAwareTrait;
use Symfony\Component\Serializer\Normalizer\DenormalizerInterface;

class ComboMetricsDenormalizer implements DenormalizerInterface, DenormalizerAwareInterface
{
    use DenormalizerAwareTrait;

    public function __construct(
        private ComboSequencesRepository $comboSequencesRepository,
    )
    {
    }

    public function supportsDenormalization($data, string $type, string $format = null, array $context = []): bool
    {
        return $type === ComboMetrics::class;
    }

    public function denormalize($data, string $type, string $format = null, array $context = []): ComboMetrics
    {
        if (!is_array($data)) {
            throw new NotNormalizableValueException('Data expected to be an array.');
        }

        $metrics = new ComboMetrics();

        if (isset($data['damage'])) {
            $metrics->setDamage((int)$data['damage']);
        }

        $metrics
            ->setDriveCost($this->extractNullableFloat($data['driveCost'] ?? null))
            ->setDriveGain($this->extractNullableFloat($data['driveGain'] ?? null))
            ->setMinimumDriveCost($this->extractNullableFloat($data['minimumDriveCost'] ?? null))
            ->setMinimumDriveCostNoBurnout($this->extractNullableFloat($data['minimumDriveCostNoBurnout'] ?? null))
            ->setSuperCost($this->extractNullableFloat($data['superCost'] ?? null))
            ->setSuperGain($this->extractNullableFloat($data['superGain'] ?? null));

        if (isset($data['sequence_id'])) {
            $sequence = $this->comboSequencesRepository->find($data['sequence_id']);
            if (!$sequence) {
                throw new NotNormalizableValueException("ComboSequence with ID {$data['sequence_id']} not found.");
            }
            $metrics->setSequence($sequence);
        }

        return $metrics;
    }

    private function extractNullableFloat(mixed $value): ?float
    {
        if (null === $value || '' === $value) {
            return null;
        }

        if (is_int($value) || is_float($value)) {
            return (float) $value;
        }

        if (is_string($value) && is_numeric(trim($value))) {
            return (float) trim($value);
        }

        return null;
    }

    public function getSupportedTypes(?string $format): array
    {
        return [
            ComboMetrics::class => true,
        ];
    }
}
