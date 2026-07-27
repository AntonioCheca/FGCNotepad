<?php declare(strict_types=1);

namespace App\Serializer\Denormalizer;

use App\Entity\ComboRequirement;
use App\Entity\ComboSequences;
use App\Entity\CharacterObjectState;
use App\Repository\ComboSequencesRepository;
use Symfony\Component\Serializer\Exception\NotNormalizableValueException;
use Symfony\Component\Serializer\Normalizer\DenormalizerInterface;

class ComboRequirementDenormalizer implements DenormalizerInterface
{
    public function __construct(
        private ComboSequencesRepository $sequencesRepository,
    ) {}

    public function supportsDenormalization(mixed $data, string $type, string $format = null, array $context = []): bool
    {
        return $type === ComboRequirement::class;
    }

    public function denormalize(mixed $data, string $type, string $format = null, array $context = []): ComboRequirement
    {
        if (!is_array($data)) {
            throw new NotNormalizableValueException('Data must be an array.');
        }

        $requirement = $context['object_to_populate'] ?? new ComboRequirement();

        if (isset($data['sequence'])) {
            $sequence = $this->sequencesRepository->find($data['sequence']);
            if (!$sequence instanceof ComboSequences) {
                throw new NotNormalizableValueException("ComboSequence with ID {$data['sequence']} not found.");
            }
            $requirement->setSequence($sequence);
        }

        $requirement->setCounterHitRequired((bool) ($data['counter_hit_required'] ?? false));
        $requirement->setPunishCounterRequired((bool) ($data['punish_counter_required'] ?? false));
        $requirement->setCornerRequired((bool) ($data['corner_required'] ?? false));
        $requirement->setAirborneRequired((bool) ($data['airborne_required'] ?? false));
        $requirement->setMidScreenRequired((bool) ($data['mid_screen_required'] ?? false));
        $requirement->setNotCrouchingRequired((bool) ($data['not_crouching_required'] ?? false));

        $objectStatePayloads = [];
        if (isset($data['combo_object_states']) && is_array($data['combo_object_states'])) {
            $objectStatePayloads = array_values(array_filter($data['combo_object_states'], 'is_array'));
        } elseif (isset($data['requirement_specific_character']) && is_array($data['requirement_specific_character'])) {
            $objectStatePayloads = [$data['requirement_specific_character']];
        }

        $requirement->getCharacterObjectStates()->clear();
        foreach ($objectStatePayloads as $payload) {
            $objectState = new CharacterObjectState();
            if (isset($payload['object_key'])) {
                $objectState->setObjectKey((string) $payload['object_key']);
            }
            if (isset($payload['character_name'])) {
                $objectState->setCharacterName((string) $payload['character_name']);
            }
            if (isset($payload['object_name'])) {
                $objectState->setObjectName((string) $payload['object_name']);
            }
            if (array_key_exists('status_required', $payload)) {
                $objectState->setStatusRequired(null === $payload['status_required'] ? null : (string) $payload['status_required']);
            }
            $objectState->setConsumed((bool) ($payload['consumed'] ?? false));
            if (array_key_exists('added_relative', $payload)) {
                $objectState->setAddedRelative(null === $payload['added_relative'] ? null : (string) $payload['added_relative']);
            }
            if (array_key_exists('added_absolute', $payload)) {
                $objectState->setAddedAbsolute(null === $payload['added_absolute'] ? null : (string) $payload['added_absolute']);
            }

            $requirement->addCharacterObjectState($objectState);
        }

        return $requirement;
    }

    public function getSupportedTypes(?string $format): array
    {
        return [
            ComboRequirement::class => true,
        ];
    }
}
