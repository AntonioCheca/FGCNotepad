<?php declare(strict_types=1);

namespace App\Serializer\Normalizer;

use App\Entity\ComboRequirement;
use Symfony\Component\Serializer\Normalizer\ContextAwareNormalizerInterface;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class ComboRequirementNormalizer implements ContextAwareNormalizerInterface
{
    public function __construct(private NormalizerInterface $normalizer)
    {
    }

    public function normalize($object, $format = null, array $context = []): array
    {
        /** @var ComboRequirement $object */
        return [
            'id' => $object->getId(),
            'counter_hit_required' => $object->isCounterHitRequired(),
            'punish_counter_required' => $object->isPunishCounterRequired(),
            'corner_required' => $object->isCornerRequired(),
            'airborne_required' => $object->isAirborneRequired(),
            'mid_screen_required' => $object->isMidScreenRequired(),
            'requirement_specific_character' => $object->getRequirementSpecificCharacter()?->getId(), // or use a DTO/Normalizer
        ];
    }

    public function supportsNormalization($data, $format = null, array $context = []): bool
    {
        return $data instanceof ComboRequirement;
    }
}
