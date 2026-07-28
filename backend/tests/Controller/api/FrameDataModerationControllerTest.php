<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\FrameData;
use App\Entity\FrameDataOverride;
use App\Entity\Move;
use App\Entity\MoveManualMetadata;
use App\Entity\User;
use App\Repository\MoveRepository;
use App\Tests\DatabaseTestCase;
use App\Util\Enum\UserRole;
use Symfony\Component\HttpFoundation\Response;

class FrameDataModerationControllerTest extends DatabaseTestCase
{
    public function testModeratorCanSaveOverrideAndReadEffectiveMoveRows(): void
    {
        $moderator = $this->createUser('moderator_user', [UserRole::MODERATOR]);
        $move = $this->createMoveWithFrameData();
        $headers = $this->loginHeaders($moderator->getUsername());

        $this->client->request(
            'PATCH',
            sprintf('/api/moderation/frame-data/overrides/%s/driveGain', $move->getFrameData()?->getId()?->toRfc4122()),
            [],
            [],
            $headers,
            json_encode(['value' => 450])
        );

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $override = $this->entityManager->getRepository(FrameDataOverride::class)->findOneBy(['frameData' => $move->getFrameData(), 'columnName' => 'driveGain']);
        self::assertInstanceOf(FrameDataOverride::class, $override);
        self::assertSame(450, $override->getOverrideValue());

        $this->client->request(
            'GET',
            sprintf('/api/moderation/frame-data/characters/%s/moves', $move->getCharacter()->getId()?->toRfc4122()),
            [],
            [],
            $headers
        );

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertSame('Ryu - 5HP', $payload['moves'][0]['name']);
        self::assertSame('5HP', $payload['moves'][0]['numpadNotation']);
        self::assertSame(500, $payload['moves'][0]['values']['driveGain']['baseValue']);
        self::assertSame(450, $payload['moves'][0]['values']['driveGain']['effectiveValue']);
        self::assertTrue($payload['moves'][0]['values']['driveGain']['isOverridden']);
    }

    public function testNormalUserCannotSaveOverride(): void
    {
        $user = $this->createUser('normal_user', [UserRole::USER]);
        $move = $this->createMoveWithFrameData();
        $headers = $this->loginHeaders($user->getUsername());

        $this->client->request(
            'PATCH',
            sprintf('/api/moderation/frame-data/overrides/%s/startup', $move->getFrameData()?->getId()?->toRfc4122()),
            [],
            [],
            $headers,
            json_encode(['value' => 7])
        );

        self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());
    }

    public function testRepositoryDamageReadsUseEffectiveOverrideValue(): void
    {
        $move = $this->createMoveWithFrameData();
        $override = (new FrameDataOverride())
            ->setFrameData($move->getFrameData())
            ->setColumnName('damage')
            ->setOverrideValue(850);

        $this->entityManager->persist($override);
        $this->entityManager->flush();
        $this->entityManager->clear();

        $repository = static::getContainer()->get(MoveRepository::class);
        $rows = $repository->findMoveDamagesByCharacterAndIds(
            $move->getCharacter()->getId()?->toRfc4122() ?? '',
            [$move->getId()?->toRfc4122() ?? '']
        );

        self::assertSame(850, $rows[0]['damage']);
    }

    public function testModeratorCanSaveManualMetadataSeparately(): void
    {
        $moderator = $this->createUser('moderator_user', [UserRole::MODERATOR]);
        $move = $this->createMoveWithFrameData();
        $headers = $this->loginHeaders($moderator->getUsername());

        $this->client->request(
            'PATCH',
            sprintf('/api/moderation/frame-data/manual-metadata/%s', $move->getId()?->toRfc4122()),
            [],
            [],
            $headers,
            json_encode(['whiffOnCrouch' => true, 'forcesStanding' => true])
        );

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $metadata = $this->entityManager->getRepository(MoveManualMetadata::class)->findOneBy(['move' => $move]);
        self::assertInstanceOf(MoveManualMetadata::class, $metadata);
        self::assertTrue($metadata->whiffsOnCrouch());
        self::assertTrue($metadata->forcesStanding());
    }

    /**
     * @param list<UserRole> $roles
     */
    private function createUser(string $username, array $roles): User
    {
        $user = new User();
        $user->setUsername($username);
        $user->setPassword(self::hashTestPassword());
        $user->setRoles(array_map(static fn (UserRole $role): string => $role->value, $roles));
        $user->setIsActive(true);

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    private function createMoveWithFrameData(): Move
    {
        $character = (new Character())->setName('Ryu');
        $frameData = (new FrameData())
            ->setStartup(8)
            ->setActive(3)
            ->setRecovery(22)
            ->setOnHit(2)
            ->setDamage(700)
            ->setDriveGain(500)
            ->setScaling('starter')
            ->setScalingStartPercent(100)
            ->setScalingImmediatePercent(100)
            ->setScalingMinimumPercent(20)
            ->setScalingComboHits(2)
            ->setScalingComboExtraPercent(10)
            ->setScalingMultiplierPercent(100);
        $move = (new Move())
            ->setCharacter($character)
            ->setNumpadNotation('5HP')
            ->setFrameData($frameData);

        $this->entityManager->persist($character);
        $this->entityManager->persist($frameData);
        $this->entityManager->persist($move);
        $this->entityManager->flush();

        return $move;
    }

    /**
     * @return array<string, string>
     */
    private function loginHeaders(string $username): array
    {
        $this->client->request(
            'POST',
            '/api/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'username' => $username,
                'password' => 'testpassword',
            ])
        );

        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);

        return [
            'HTTP_X_CSRF_TOKEN' => (string) ($payload['csrfToken'] ?? ''),
            'CONTENT_TYPE' => 'application/json',
        ];
    }
}
