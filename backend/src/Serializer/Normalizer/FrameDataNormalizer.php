<?php declare(strict_types=1);

namespace App\Serializer\Normalizer;

use App\Entity\FrameData;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class FrameDataNormalizer implements NormalizerInterface
{
    public function normalize(mixed $object, ?string $format = null, array $context = []): array
    {
        /** @var FrameData $object */
        return [
            'id' => $object->getId(),
            'startup' => $object->getStartup(),
            'active' => $object->getActive(),
            'recovery' => $object->getRecovery(),
            'total' => $object->getTotal(),
            'onHit' => $object->getOnHit(),
            'onBlock' => $object->getOnBlock(),
            'damage' => $object->getDamage(),
            'moveType' => $object->getMoveType(),
            'attackLevel' => $object->getAttackLevel(),
        ];
    }

    public function supportsNormalization(mixed $data, ?string $format = null, array $context = []): bool
    {
        return $data instanceof FrameData;
    }

    public function getSupportedTypes(?string $format): array
    {
        return [
            FrameData::class => true,
        ];
    }
}
