<?php declare(strict_types=1);

namespace App\Normalizer;

use App\Entity\ComboMetrics;
use App\Repository\ComboSequencesRepository;
use Symfony\Component\Serializer\Normalizer\ContextAwareDenormalizerInterface;
use Symfony\Component\Serializer\Exception\NotNormalizableValueException;

class ComboMetricsDenormalizer implements ContextAwareDenormalizerInterface
{
    public function __construct(
        private ComboSequencesRepository $comboSequencesRepository,
    ) {}

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
            $metrics->setDamage((int) $data['damage']);
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
}
