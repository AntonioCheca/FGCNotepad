<?php declare(strict_types=1);

namespace App\Serializer\Normalizer;

use App\Entity\UserCombo;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class UserComboNormalizer implements NormalizerInterface
{
    public function normalize(mixed $object, ?string $format = null, array $context = []): array
    {
        /** @var UserCombo $object */
        return [
            'id' => $object->getId(),
            'user' => $object->getUser() ? [
                'id' => $object->getUser()->getId(),
                'username' => $object->getUser()->getUsername(),
            ] : null,
            'comboSequence' => $object->getComboSequence() ? [
                'id' => $object->getComboSequence()->getId(),
                'name' => $object->getComboSequence()->getName(),
            ] : null,
        ];
    }

    public function supportsNormalization(mixed $data, ?string $format = null, array $context = []): bool
    {
        return $data instanceof UserCombo;
    }

    public function getSupportedTypes(?string $format): array
    {
        return [
            UserCombo::class => true,
        ];
    }
}
