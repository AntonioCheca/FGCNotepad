<?php declare(strict_types=1);

namespace App\Serializer\Normalizer;

use App\Entity\Post;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class PostNormalizer implements NormalizerInterface
{
    public function normalize(mixed $object, ?string $format = null, array $context = []): array
    {
        /** @var Post $object */
        return [
            'id' => $object->getId(),
            'title' => $object->getTitle(),
            'content' => $object->getBody(),
            'createdAt' => $object->getCreatedAt()->format('Y-m-d H:i:s'),
            'author' => $object->getAuthor() ? [
                'id' => $object->getAuthor()->getId(),
                'username' => $object->getAuthor()->getUsername(),
            ] : null,
        ];
    }

    public function supportsNormalization(mixed $data, ?string $format = null, array $context = []): bool
    {
        return $data instanceof Post;
    }

    public function getSupportedTypes(?string $format): array
    {
        return [
            Post::class => true,
        ];
    }
}
