<?php declare(strict_types=1);

namespace App\Serializer\Normalizer;

use App\Entity\ComboSequences;
use App\Entity\Move;
use App\Entity\ComboSequenceType;
use App\Entity\ComboMetrics;
use App\Entity\ComboRequirement;
use App\Entity\Visibility;
use App\Entity\Season;
use Symfony\Component\Serializer\Normalizer\NormalizerAwareInterface;
use Symfony\Component\Serializer\Normalizer\NormalizerAwareTrait;
use Symfony\Component\Serializer\Normalizer\DenormalizerAwareInterface;
use Symfony\Component\Serializer\Normalizer\DenormalizerAwareTrait;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;
use Symfony\Component\Serializer\Normalizer\DenormalizerInterface;

class ComboSequencesNormalizer implements NormalizerInterface, DenormalizerInterface, NormalizerAwareInterface, DenormalizerAwareInterface
{
    use NormalizerAwareTrait;
    use DenormalizerAwareTrait;

    public function normalize(mixed $object, ?string $format = null, array $context = []): array
    {
        /** @var ComboSequences $object */
        return [
            'id' => $object->getId(),
            'name' => $object->getName(),
            'description' => $object->getDescription(),
            'move' => $object->getMove() ? $this->normalizer->normalize($object->getMove(), $format, $context) : null,
            'type' => $object->getType() ? $this->normalizer->normalize($object->getType(), $format, $context) : null,
            'comboMetrics' => $object->getComboMetrics() ? $this->normalizer->normalize($object->getComboMetrics(), $format, $context) : null,
            'comboRequirement' => $object->getComboRequirement() ? $this->normalizer->normalize($object->getComboRequirement(), $format, $context) : null,
            'visibility' => $object->getVisibility() ? $this->normalizer->normalize($object->getVisibility(), $format, $context) : null,
            'season' => $this->normalizer->normalize($object->getSeason()->toArray(), $format, $context),
            'character' => $object->getCharacter() ? [
                'id' => $object->getCharacter()->getId(),
                'name' => $object->getCharacter()->getName(),
            ] : null,
        ];
    }

    public function supportsNormalization(mixed $data, ?string $format = null, array $context = []): bool
    {
        return $data instanceof ComboSequences;
    }

    public function denormalize(mixed $data, string $type, ?string $format = null, array $context = []): ComboSequences
    {
        $combo = new ComboSequences();
        $combo->setName($data['name'] ?? '')
            ->setDescription($data['description'] ?? '')
            ->setMove($this->denormalizer->denormalize($data['move'] ?? null, Move::class, $format, $context))
            ->setType($this->denormalizer->denormalize($data['type'] ?? null, ComboSequenceType::class, $format, $context))
            ->setComboMetrics($this->denormalizer->denormalize($data['comboMetrics'] ?? null, ComboMetrics::class, $format, $context))
            ->setComboRequirement($this->denormalizer->denormalize($data['comboRequirement'] ?? null, ComboRequirement::class, $format, $context))
            ->setVisibility($this->denormalizer->denormalize($data['visibility'] ?? null, Visibility::class, $format, $context));

        foreach ($data['season'] ?? [] as $seasonData) {
            $season = $this->denormalizer->denormalize($seasonData, Season::class, $format, $context);
            $combo->addSeason($season);
        }

        return $combo;
    }

    public function supportsDenormalization(mixed $data, string $type, ?string $format = null, array $context = []): bool
    {
        return $type === ComboSequences::class;
    }

    public function getSupportedTypes(?string $format): array
    {
        return [
            ComboSequences::class => true,
        ];
    }
}
