<?php declare(strict_types=1);

namespace App\Serializer\Normalizer;

use App\Entity\ComboSequences;
use App\Entity\ComboMetrics;
use App\Entity\ComboSequenceType;
use App\Entity\ComboRequirement;
use App\Entity\Move;
use App\Entity\Season;
use App\Entity\Step;
use App\Entity\Visibility;
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
        $sortedSteps = $this->sortStepsByOrdinal($object);
        $needsDelayAuditReview = $this->needsDelayAuditReview($sortedSteps);

        return [
            'id' => $object->getId(),
            'name' => $object->getName(),
            'description' => $object->getDescription(),
            'move' => $object->getMove() ? $this->normalizer->normalize($object->getMove(), $format, $context) : null,
            'type' => $object->getType() ? $this->normalizer->normalize($object->getType(), $format, $context) : null,
            'comboMetrics' => $object->getComboMetrics() ? $this->normalizer->normalize($object->getComboMetrics(), $format, $context) : null,
            'comboRequirement' => $object->getComboRequirement() ? $this->normalizer->normalize($object->getComboRequirement(), $format, $context) : null,
            'visibility' => $object->getVisibility() ? $this->normalizer->normalize($object->getVisibility(), $format, $context) : null,
            'moderationState' => $object->getModerationState(),
            'season' => $this->normalizer->normalize($object->getSeason()->toArray(), $format, $context),
            'steps' => $this->normalizer->normalize($sortedSteps, $format, $context),
            'is_usable' => true,
            'is_fully_audited' => !$needsDelayAuditReview,
            'needs_technical_review' => $needsDelayAuditReview,
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

    /**
     * @return array<int, mixed>
     */
    private function sortStepsByOrdinal(ComboSequences $comboSequences): array
    {
        $steps = $comboSequences->getSteps()->toArray();

        usort(
            $steps,
            static fn ($a, $b): int => ($a?->getOrdinalInCombo() ?? 0) <=> ($b?->getOrdinalInCombo() ?? 0)
        );

        return $steps;
    }

    /**
     * @param array<int, mixed> $steps
     */
    private function needsDelayAuditReview(array $steps): bool
    {
        foreach ($steps as $step) {
            if (!$step instanceof Step) {
                continue;
            }

            $hasDelayMetadata = null !== $step->getDelayMinFrames()
                || null !== $step->getDelayMaxFrames()
                || $step->isDelayMinUnverified()
                || $step->isDelayMaxUnverified();

            if (!$hasDelayMetadata) {
                continue;
            }

            if (null === $step->getDelayMinFrames() || null === $step->getDelayMaxFrames()) {
                return true;
            }

            if ($step->isDelayMinUnverified() || $step->isDelayMaxUnverified()) {
                return true;
            }

            if (!$this->isDelayConnection($step)) {
                return true;
            }
        }

        return false;
    }

    private function isDelayConnection(Step $step): bool
    {
        $connectionTypeName = $step->getConnectionType()?->getName();
        if (!is_string($connectionTypeName) || '' === $connectionTypeName) {
            return false;
        }

        $normalized = strtolower($connectionTypeName);
        $normalized = preg_replace('/[^a-z0-9]/', '', $normalized) ?? $normalized;

        return 'delay' === $normalized;
    }
}
