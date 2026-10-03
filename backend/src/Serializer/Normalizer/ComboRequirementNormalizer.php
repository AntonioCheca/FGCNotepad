<?php declare(strict_types=1);

namespace App\Serializer\Normalizer;

use App\Entity\CharacterObjectState;
use App\Entity\ComboRequirement;
use App\Repository\CharacterObjectRepository;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class ComboRequirementNormalizer implements NormalizerInterface
{
    /** @var array<string, string|null> Kinds by object key; lists normalize many combos sharing the same objects. */
    private array $kindsByKey = [];

    public function __construct(private readonly CharacterObjectRepository $characterObjectRepository)
    {
    }

    public function normalize($object, $format = null, array $context = []): array
    {
        /** @var ComboRequirement $object */
        $objectStates = $object->getCharacterObjectStates()->toArray();
        $firstObjectState = $objectStates[0] ?? null;
        $normalizedObjectStates = array_map(fn (CharacterObjectState $objectState): array => [
            'id' => $objectState->getId(),
            'object_key' => $objectState->getObjectKey(),
            'character_name' => $objectState->getCharacterName(),
            'object_name' => $objectState->getObjectName(),
            'kind' => $this->resolveKind($objectState),
            'status_required' => $objectState->getStatusRequired(),
            'consumed' => $objectState->isConsumed(),
            'added_relative' => $objectState->getAddedRelative(),
            'added_absolute' => $objectState->getAddedAbsolute(),
        ], $objectStates);

        return [
            'id' => $object->getId(),
            'counter_hit_required' => $object->isCounterHitRequired(),
            'punish_counter_required' => $object->isPunishCounterRequired(),
            'perfect_parry_required' => $object->isPerfectParryRequired(),
            'blocked_drive_impact_stun_required' => $object->isBlockedDriveImpactStunRequired(),
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

    /**
     * Stored states usually carry only the object key, so the catalog object is looked up to tell stock, scaler and state apart.
     */
    private function resolveKind(CharacterObjectState $objectState): ?string
    {
        $object = $objectState->getCharacterObject();
        if (null !== $object) {
            return $object->getKind();
        }
        $key = $objectState->getObjectKey();
        if (null === $key) {
            return null;
        }
        if (!array_key_exists($key, $this->kindsByKey)) {
            $this->kindsByKey[$key] = $this->characterObjectRepository->findOneByKey($key)?->getKind();
        }

        return $this->kindsByKey[$key];
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
