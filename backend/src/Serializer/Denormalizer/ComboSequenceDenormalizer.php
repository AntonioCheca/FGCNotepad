<?php declare(strict_types=1);

namespace App\Normalizer;

use App\Entity\ComboSequences;
use Symfony\Component\Serializer\Normalizer\ContextAwareDenormalizerInterface;
use Symfony\Component\Serializer\Exception\NotNormalizableValueException;

class ComboSequencesDenormalizer implements ContextAwareDenormalizerInterface
{
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
}
