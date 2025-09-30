<?php declare(strict_types=1);

namespace App\Serializer\Denormalizer;

use App\Entity\ComboSequences;
use Symfony\Component\Serializer\Normalizer\ContextAwareDenormalizerInterface;
use Symfony\Component\Serializer\Exception\NotNormalizableValueException;
use Symfony\Component\Serializer\Normalizer\DenormalizerAwareInterface;
use Symfony\Component\Serializer\Normalizer\DenormalizerAwareTrait;
use Symfony\Component\Serializer\Normalizer\DenormalizerInterface;

class ComboSequenceDenormalizer implements DenormalizerInterface, DenormalizerAwareInterface
{
    use DenormalizerAwareTrait;

    public function supportsDenormalization($data, string $type, string $format = null, array $context = []): bool
    {
        return $type === ComboSequences::class;
    }

    public function denormalize($data, string $type, string $format = null, array $context = []): ComboSequences
    {
        if (!is_array($data)) {
            throw new NotNormalizableValueException('Data expected to be an array.');
        }

        $sequence = new ComboSequences();

        if (isset($data['name'])) {
            $sequence->setName((string)$data['name']);
        }

        if (isset($data['description'])) {
            $sequence->setDescription((string)$data['description']);
        }

        return $sequence;
    }

    public function getSupportedTypes(?string $format): array
    {
        return [
            ComboSequences::class => true,
        ];
    }
}
