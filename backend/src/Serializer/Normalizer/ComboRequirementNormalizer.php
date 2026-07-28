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
        $objectStates = $object->getCharacterObjectStates()->toArray();
        $firstObjectState = $objectStates[0] ?? null;
        $normalizedObjectStates = array_map(static fn ($objectState): array => [
            'id' => $objectState->getId(),
            'object_key' => $objectState->getObjectKey(),
            'character_name' => $objectState->getCharacterName(),
            'object_name' => $objectState->getObjectName(),
            'status_required' => $objectState->getStatusRequired(),
            'consumed' => $objectState->isConsumed(),
            'added_relative' => $objectState->getAddedRelative(),
            'added_absolute' => $objectState->getAddedAbsolute(),
        ], $objectStates);

        return [
            'id' => $object->getId(),
            'counter_hit_required' => $object->isCounterHitRequired(),
            'punish_counter_required' => $object->isPunishCounterRequired(),
            'corner_required' => $object->isCornerRequired(),
            'airborne_required' => $object->isAirborneRequired(),
            'not_crouching_required' => $object->isNotCrouchingRequired(),
            'side_switches_required' => $object->isSideSwitchesRequired(),
            'initial_opponent_posture' => $object->getInitialOpponentPosture(),
            'initial_opponent_ground_state' => $object->getInitialOpponentGroundState(),
            'initial_juggle_altitude' => $object->getInitialJuggleAltitude(),
            'combo_object_states' => $normalizedObjectStates,
            'requirement_specific_character' => null !== $firstObjectState ? [
                'id' => $firstObjectState->getId(),
                'object_key' => $firstObjectState->getObjectKey(),
                'character_name' => $firstObjectState->getCharacterName(),
                'object_name' => $firstObjectState->getObjectName(),
                'status_required' => $firstObjectState->getStatusRequired(),
                'consumed' => $firstObjectState->isConsumed(),
                'added_relative' => $firstObjectState->getAddedRelative(),
                'added_absolute' => $firstObjectState->getAddedAbsolute(),
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
