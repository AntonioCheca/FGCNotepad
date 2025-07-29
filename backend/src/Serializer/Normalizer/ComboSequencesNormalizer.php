<?php declare(strict_types=1);

namespace App\Normalizer;

use App\Entity\ComboMetrics;
use App\Entity\ComboRequirement;
use App\Entity\ComboSequences;
use App\Entity\ComboSequenceType;
use App\Entity\Move;
use App\Entity\Season;
use App\Entity\Visibility;
use Symfony\Component\Serializer\Normalizer\ContextAwareNormalizerInterface;
use Symfony\Component\Serializer\Normalizer\ContextAwareDenormalizerInterface;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;
use Symfony\Component\Serializer\Normalizer\DenormalizerInterface;

class ComboSequencesNormalizer implements ContextAwareNormalizerInterface, ContextAwareDenormalizerInterface
{
    public function __construct(
        private NormalizerInterface   $normalizer,
        private DenormalizerInterface $denormalizer
    )
    {
    }

    public function supportsNormalization($data, string $format = null, array $context = []): bool
    {
        return $data instanceof ComboSequences;
    }

    public function normalize($object, string $format = null, array $context = []): array
    {
        /** @var ComboSequences $object */
        return [
            'id' => $object->getId(),
            'name' => $object->getName(),
            'description' => $object->getDescription(),
            'move' => $this->normalizer->normalize($object->getMove(), $format, $context),
            'type' => $this->normalizer->normalize($object->getType(), $format, $context),
            'comboMetrics' => $this->normalizer->normalize($object->getComboMetrics(), $format, $context),
            'comboRequirement' => $this->normalizer->normalize($object->getComboRequirement(), $format, $context),
            'visibility' => $this->normalizer->normalize($object->getVisibility(), $format, $context),
            'season' => array_map(fn($season) => $this->normalizer->normalize($season, $format, $context), $object->getSeason()->toArray()),
        ];
    }

    public function supportsDenormalization($data, string $type, string $format = null, array $context = []): bool
    {
        return $type === ComboSequences::class;
    }

    public function denormalize($data, string $type, string $format = null, array $context = []): ComboSequences
    {
        /** @var ComboSequences $combo */
        $combo = new ComboSequences();
        $combo->setName($data['name'] ?? '')
            ->setDescription($data['description'] ?? '')
            ->setMove($this->denormalizer->denormalize($data['move'], Move::class, $format, $context))
            ->setType($this->denormalizer->denormalize($data['type'], ComboSequenceType::class, $format, $context))
            ->setComboMetrics($this->denormalizer->denormalize($data['comboMetrics'], ComboMetrics::class, $format, $context))
            ->setComboRequirement($this->denormalizer->denormalize($data['comboRequirement'], ComboRequirement::class, $format, $context))
            ->setVisibility($this->denormalizer->denormalize($data['visibility'], Visibility::class, $format, $context));

        foreach ($data['season'] ?? [] as $seasonData) {
            $season = $this->denormalizer->denormalize($seasonData, Season::class, $format, $context);
            $combo->addSeason($season);
        }

        return $combo;
    }
}
