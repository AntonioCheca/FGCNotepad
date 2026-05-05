<?php declare(strict_types=1);

namespace App\Serializer\Normalizer;

use App\Entity\UserCombo;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class UserComboNormalizer implements NormalizerInterface
{
    /**
     * @param array<string, mixed> $context
     * @return array<string, mixed>
     */
    public function normalize(mixed $object, ?string $format = null, array $context = []): array
    {
        /** @var UserCombo $object */
        return [
            'id' => $object->getId(),
            'user' => $object->getUser() ? [
                'id' => $object->getUser()->getId()?->toRfc4122(),
                'username' => $object->getUser()->getUsername(),
            ] : null,
            'comboSequence' => $object->getCombo() ? [
                'id' => $object->getCombo()->getId(),
                'name' => $object->getCombo()->getName(),
            ] : null,
            'character' => $object->getCharacter() ? [
                'id' => $object->getCharacter()->getId()?->toRfc4122(),
                'name' => $object->getCharacter()->getName(),
            ] : null,
            'known' => $object->isKnown(),
        ];
    }

    /** @param array<string, mixed> $context */
    public function supportsNormalization(mixed $data, ?string $format = null, array $context = []): bool
    {
        return $data instanceof UserCombo;
    }

    /** @return array<class-string, bool> */
    public function getSupportedTypes(?string $format): array
    {
        return [
            UserCombo::class => true,
        ];
    }
}
