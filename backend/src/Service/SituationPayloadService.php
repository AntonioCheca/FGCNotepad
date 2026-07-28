<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Character;
use App\Entity\Move;
use App\Entity\Situation;
use App\Entity\SituationType;
use App\Entity\User;
use App\Repository\SituationTypeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class SituationPayloadService
{
    private const MOVE_REQUIRED_TYPES = [SituationType::BLOCKED_MOVE, SituationType::WHIFFED_MOVE];
    private const MOVE_FORBIDDEN_TYPES = [SituationType::DRIVE_IMPACT_PC_STATE, SituationType::STUN];

    public function __construct(
        private readonly SituationTypeRepository $situationTypeRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /** @param array<string,mixed> $payload */
    public function applyPayload(Situation $situation, array $payload, ?User $createdBy = null): Situation
    {
        $type = $this->resolveType($payload['typeId'] ?? $payload['type_id'] ?? null, $payload['typeCode'] ?? $payload['type_code'] ?? null);
        $situation->setType($type);
        $situation->setName($this->requiredString($payload, 'name'));
        $situation->setDescription($this->optionalString($payload, 'description') ?? '');
        $situation->setOpponentCharacter($this->findNullableEntity(Character::class, $payload['opponentCharacterId'] ?? $payload['opponent_character_id'] ?? null));
        $situation->setMove($this->findNullableEntity(Move::class, $payload['moveId'] ?? $payload['move_id'] ?? null));
        $situation->setFrameAdvantage($this->optionalInt($payload, 'frameAdvantage', 'frame_advantage'));
        $situation->setPunishWindowFrames($this->optionalInt($payload, 'punishWindowFrames', 'punish_window_frames'));
        $situation->setStartingDistanceMeters($this->optionalFloat($payload, 'startingDistanceMeters', 'starting_distance_meters'));
        $situation->setOpponentState($this->choice($payload['opponentState'] ?? $payload['opponent_state'] ?? Situation::OPPONENT_STATE_GROUNDED, [Situation::OPPONENT_STATE_GROUNDED, Situation::OPPONENT_STATE_AIRBORNE], 'opponentState'));
        $situation->setInitialJuggleAltitude($this->optionalChoice($payload['initialJuggleAltitude'] ?? $payload['initial_juggle_altitude'] ?? null, [Situation::ALTITUDE_LOW, Situation::ALTITUDE_MEDIUM, Situation::ALTITUDE_HIGH], 'initialJuggleAltitude'));
        $situation->setCornerState($this->choice($payload['cornerState'] ?? $payload['corner_state'] ?? Situation::CORNER_EITHER, [Situation::CORNER_MIDSCREEN, Situation::CORNER_CORNER, Situation::CORNER_EITHER], 'cornerState'));
        $situation->setCounterHitState($this->choice($payload['counterHitState'] ?? $payload['counter_hit_state'] ?? Situation::COUNTER_NORMAL, [Situation::COUNTER_NORMAL, Situation::COUNTER_COUNTER_HIT, Situation::COUNTER_PUNISH_COUNTER], 'counterHitState'));
        $situation->setNotes($this->optionalString($payload, 'notes'));
        $situation->setIsVerified($this->optionalBool($payload, 'isVerified', 'is_verified') ?? false);
        $situation->setIsArchived($this->optionalBool($payload, 'isArchived', 'is_archived') ?? false);

        if (null === $situation->getCreatedBy()) {
            $situation->setCreatedBy($createdBy);
        }

        $this->validate($situation);

        return $situation;
    }

    /** @return array<string,mixed> */
    public function normalize(Situation $situation): array
    {
        $move = $situation->getMove();
        $opponentCharacter = $situation->getOpponentCharacter();

        return [
            'id' => $situation->getId(),
            'type' => $this->normalizeType($situation->getType()),
            'name' => $situation->getName(),
            'description' => $situation->getDescription(),
            'opponentCharacter' => $opponentCharacter instanceof Character ? ['id' => (string) $opponentCharacter->getId(), 'name' => $opponentCharacter->getName()] : null,
            'move' => $move instanceof Move ? ['id' => (string) $move->getId(), 'name' => $move->getName(), 'notation' => $move->getNumpadNotation()] : null,
            'frameAdvantage' => $situation->getFrameAdvantage(),
            'punishWindowFrames' => $situation->getPunishWindowFrames(),
            'startingDistanceMeters' => $situation->getStartingDistanceMeters(),
            'opponentState' => $situation->getOpponentState(),
            'initialJuggleAltitude' => $situation->getInitialJuggleAltitude(),
            'cornerState' => $situation->getCornerState(),
            'counterHitState' => $situation->getCounterHitState(),
            'notes' => $situation->getNotes(),
            'isVerified' => $situation->isVerified(),
            'isArchived' => $situation->isArchived(),
            'createdAt' => $situation->getCreatedAt()->format(DATE_ATOM),
            'updatedAt' => $situation->getUpdatedAt()->format(DATE_ATOM),
        ];
    }

    /** @return array{id:int|null,code:string,name:string,description:string} */
    public function normalizeType(SituationType $type): array
    {
        return ['id' => $type->getId(), 'code' => $type->getCode(), 'name' => $type->getName(), 'description' => $type->getDescription()];
    }

    private function validate(Situation $situation): void
    {
        $typeCode = $situation->getType()->getCode();
        if (in_array($typeCode, self::MOVE_REQUIRED_TYPES, true) && !$situation->getMove() instanceof Move) {
            throw new BadRequestHttpException('moveId is required for blocked and whiffed move situations.');
        }
        if (in_array($typeCode, self::MOVE_FORBIDDEN_TYPES, true) && $situation->getMove() instanceof Move) {
            throw new BadRequestHttpException('moveId must be null for Drive Impact PC and stun situations.');
        }
        if (Situation::OPPONENT_STATE_GROUNDED === $situation->getOpponentState() && null !== $situation->getInitialJuggleAltitude()) {
            throw new BadRequestHttpException('initialJuggleAltitude must be null for grounded situations.');
        }
    }

    private function resolveType(mixed $typeId, mixed $typeCode): SituationType
    {
        $type = null;
        if (is_int($typeId) || (is_string($typeId) && ctype_digit($typeId))) {
            $type = $this->situationTypeRepository->find((int) $typeId);
        } elseif (is_string($typeCode) && '' !== trim($typeCode)) {
            $type = $this->situationTypeRepository->findOneBy(['code' => trim($typeCode)]);
        }

        if (!$type instanceof SituationType) {
            throw new BadRequestHttpException('Valid situation type is required.');
        }

        return $type;
    }

    /** @template T of object @param class-string<T> $class @return T|null */
    private function findNullableEntity(string $class, mixed $id): ?object
    {
        if (null === $id || '' === trim((string) $id)) {
            return null;
        }

        $entity = $this->entityManager->getRepository($class)->find((string) $id);
        if (!$entity instanceof $class) {
            throw new BadRequestHttpException(sprintf('%s was not found.', basename(str_replace('\\', '/', $class))));
        }

        return $entity;
    }

    /** @param array<string,mixed> $payload */
    private function requiredString(array $payload, string $key): string
    {
        $value = $payload[$key] ?? null;
        if (!is_string($value) || '' === trim($value)) {
            throw new BadRequestHttpException(sprintf('%s is required.', $key));
        }

        return trim($value);
    }

    /** @param array<string,mixed> $payload */
    private function optionalString(array $payload, string $key): ?string
    {
        $value = $payload[$key] ?? null;
        return is_string($value) && '' !== trim($value) ? trim($value) : null;
    }

    /** @param array<string,mixed> $payload */
    private function optionalInt(array $payload, string $camelKey, string $snakeKey): ?int
    {
        $value = $payload[$camelKey] ?? $payload[$snakeKey] ?? null;
        return is_int($value) || (is_string($value) && preg_match('/^-?\d+$/', trim($value))) ? (int) $value : null;
    }

    /** @param array<string,mixed> $payload */
    private function optionalFloat(array $payload, string $camelKey, string $snakeKey): ?float
    {
        $value = $payload[$camelKey] ?? $payload[$snakeKey] ?? null;
        return is_int($value) || is_float($value) || (is_string($value) && is_numeric(trim($value))) ? (float) $value : null;
    }

    /** @param array<string,mixed> $payload */
    private function optionalBool(array $payload, string $camelKey, string $snakeKey): ?bool
    {
        $value = $payload[$camelKey] ?? $payload[$snakeKey] ?? null;
        return is_bool($value) ? $value : null;
    }

    /** @param list<string> $allowed */
    private function choice(mixed $value, array $allowed, string $field): string
    {
        if (!is_string($value) || !in_array($value, $allowed, true)) {
            throw new BadRequestHttpException(sprintf('%s has an unsupported value.', $field));
        }

        return $value;
    }

    /** @param list<string> $allowed */
    private function optionalChoice(mixed $value, array $allowed, string $field): ?string
    {
        if (null === $value || '' === trim((string) $value)) {
            return null;
        }

        return $this->choice($value, $allowed, $field);
    }
}
