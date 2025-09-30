<?php declare(strict_types=1);

namespace App\Serializer\Denormalizer;

use App\Entity\Character;
use App\Entity\Move;
use App\Repository\CharacterRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Serializer\Normalizer\DenormalizerInterface;

class MoveDenormalizer implements DenormalizerInterface
{
    public function __construct(private EntityManagerInterface $entityManager, private CharacterRepository $characterRepository)
    {
    }

    public function denormalize(mixed $data, string $type, ?string $format = null, array $context = []): Move
    {
        // Defensive: make sure we have required fields
        if (empty($data['numpadNotation'])) {
            throw new \InvalidArgumentException('Missing numpadNotation when denormalizing Move.');
        }

        if (empty($data['character'])) {
            throw new \InvalidArgumentException('Missing character information when denormalizing Move.');
        }

        // Try to resolve the Character
        $character = $this->resolveCharacter($data['character']);

        // Try to find an existing Move for this character + numpad
        $repo = $this->entityManager->getRepository(Move::class);
        $existing = $repo->findOneBy([
            'character' => $character,
            'numpadNotation' => $data['numpadNotation'],
        ]);

        if ($existing) {
            return $existing;
        }

        // Otherwise, create new Move
        $move = new Move();
        $move->setCharacter($character);
        $move->setNumpadNotation($data['numpadNotation']);

        return $move;
    }

    private function resolveCharacter(array $data): Character
    {
        if (!empty($data['id'])) {
            $character = $this->characterRepository->find($data['id']);
            if ($character) {
                return $character;
            }
        }

        if (!empty($data['name'])) {
            $character = $this->characterRepository->findOneBy(['name' => $data['name']]);
            if ($character) {
                return $character;
            }
        }

        // 3️⃣ Otherwise fail — Move cannot exist without a valid Character
        throw new \InvalidArgumentException('Character not found when denormalizing Move: ' . json_encode($data));
    }

    public function supportsDenormalization(mixed $data, string $type, ?string $format = null, array $context = []): bool
    {
        return $type === Move::class;
    }

    public function getSupportedTypes(?string $format): array
    {
        return [Move::class => true];
    }
}
