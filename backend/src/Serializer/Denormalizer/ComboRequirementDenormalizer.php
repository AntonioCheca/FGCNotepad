<?php declare(strict_types=1);

namespace App\Serializer\Denormalizer;

use App\Entity\ComboRequirement;
use App\Entity\ComboSequences;
use App\Entity\RequirementSpecificCharacter;
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

        // Handle nested character-specific requirement if present
        if (isset($data['requirement_specific_character'])) {
            $charReq = $requirement->getRequirementSpecificCharacter() ?? new RequirementSpecificCharacter();

            // Use the correct property names from the entity
            if (isset($data['requirement_specific_character']['object_name'])) {
                $charReq->setObjectName($data['requirement_specific_character']['object_name']);
            }

            if (isset($data['requirement_specific_character']['status_required'])) {
                $charReq->setStatusRequired($data['requirement_specific_character']['status_required']);
            }

            $requirement->setRequirementSpecificCharacter($charReq);
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
