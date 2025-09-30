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

        if (isset($data['sequence_id'])) {
            $sequence = $this->comboSequencesRepository->find($data['sequence_id']);
            if (!$sequence) {
                throw new NotNormalizableValueException("ComboSequence with ID {$data['sequence_id']} not found.");
            }
            $metrics->setSequence($sequence);
        }

        return $metrics;
    }

    public function getSupportedTypes(?string $format): array
    {
        return [
            ComboMetrics::class => true,
        ];
    }
}
