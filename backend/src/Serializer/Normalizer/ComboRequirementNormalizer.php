<?php declare(strict_types=1);

namespace App\Serializer\Normalizer;

use App\Entity\ComboRequirement;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class ComboRequirementNormalizer implements NormalizerInterface
{
    public function __construct()
    {
    }

    public function normalize($object, $format = null, array $context = []): array
    {
        /** @var ComboRequirement $object */
        $specificCharacter = $object->getRequirementSpecificCharacter();

        return [
            'id' => $object->getId(),
            'counter_hit_required' => $object->isCounterHitRequired(),
            'punish_counter_required' => $object->isPunishCounterRequired(),
            'corner_required' => $object->isCornerRequired(),
            'airborne_required' => $object->isAirborneRequired(),
            'mid_screen_required' => $object->isMidScreenRequired(),
            'not_crouching_required' => $object->isNotCrouchingRequired(),
            'requirement_specific_character' => null !== $specificCharacter ? [
                'id' => $specificCharacter->getId(),
                'object_name' => $specificCharacter->getObjectName(),
                'status_required' => $specificCharacter->getStatusRequired(),
            ] : null,
        ];
    }

    public function supportsNormalization($data, $format = null, array $context = []): bool
    {
        return $data instanceof ComboRequirement;
    }

    public function getSupportedTypes(?string $format): array
    {
        return [
            ComboRequirement::class => true,
        ];
    }
}
