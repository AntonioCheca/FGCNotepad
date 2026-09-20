<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\Move;
use App\Entity\OkiProfile;
use App\Entity\OkiSetup;
use App\Entity\User;
use App\Tests\DatabaseTestCase;
use App\Util\Enum\UserRole;
use Symfony\Component\HttpFoundation\Response;

final class OkiModerationControllerTest extends DatabaseTestCase
{
    /** @var array<string, string> */
    private array $headers = [];
    private ?string $loggedInUsername = null;

    public function testNewSetupIsPendingAndOnlyVisibleToAuthorAndModerators(): void
    {
        [$ender, $follow] = $this->persistMoves();
        $author = $this->createUser([UserRole::USER]);
        $other = $this->createUser([UserRole::USER]);
        $moderator = $this->createUser([UserRole::MODERATOR]);

        $created = $this->request($author, 'POST', '/api/okis', $this->payload($ender, $follow), Response::HTTP_CREATED);
        self::assertSame('pending_review', $created['setups'][0]['moderationState']);
        self::assertTrue($created['setups'][0]['canEdit']);
        $profileId = $created['id'];

        self::assertCount(1, $this->request($author, 'GET', '/api/okis'));
        self::assertCount(0, $this->request($other, 'GET', '/api/okis'));
        $this->request($other, 'GET', '/api/okis/' . $profileId, null, Response::HTTP_NOT_FOUND);
        self::assertCount(1, $this->request($moderator, 'GET', '/api/okis'));

        $queue = $this->request($moderator, 'GET', '/api/moderation/queue?contentType=oki');
        self::assertCount(1, $queue['data']);
        self::assertSame('oki', $queue['data'][0]['contentType']);

        $setupId = $created['setups'][0]['id'];
        $decision = $this->request($moderator, 'POST', sprintf('/api/moderation/oki/%d/approve', $setupId));
        self::assertSame('approved', $decision['moderationState']);

        self::assertCount(1, $this->request($other, 'GET', '/api/okis'));
        $detail = $this->request($other, 'GET', '/api/okis/' . $profileId);
        self::assertFalse($detail['setups'][0]['canEdit']);
    }

    public function testRejectRequiresReasonAndHidesFromOthers(): void
    {
        [$ender, $follow] = $this->persistMoves();
        $author = $this->createUser([UserRole::USER]);
        $other = $this->createUser([UserRole::USER]);
        $moderator = $this->createUser([UserRole::MODERATOR]);
        $created = $this->request($author, 'POST', '/api/okis', $this->payload($ender, $follow), Response::HTTP_CREATED);
        $setupId = $created['setups'][0]['id'];

        $this->request($moderator, 'POST', sprintf('/api/moderation/oki/%d/reject', $setupId), [], Response::HTTP_BAD_REQUEST);
        $this->request($moderator, 'POST', sprintf('/api/moderation/oki/%d/reject', $setupId), ['reason' => 'Not a real setup']);

        self::assertCount(0, $this->request($other, 'GET', '/api/okis'));
        $own = $this->request($author, 'GET', '/api/okis/' . $created['id']);
        self::assertSame('rejected', $own['setups'][0]['moderationState']);
        self::assertSame('Not a real setup', $own['setups'][0]['moderationReason']);
    }

    public function testCreatingForExistingMoveAppendsAndEditingOnlyTouchesOwnSetups(): void
    {
        [$ender, $follow] = $this->persistMoves();
        $first = $this->createUser([UserRole::USER]);
        $second = $this->createUser([UserRole::USER]);
        $moderator = $this->createUser([UserRole::MODERATOR]);

        $created = $this->request($first, 'POST', '/api/okis', $this->payload($ender, $follow), Response::HTTP_CREATED);
        $this->request($moderator, 'POST', sprintf('/api/moderation/oki/%d/approve', $created['setups'][0]['id']));

        $appended = $this->request($second, 'POST', '/api/okis', $this->payload($ender, $follow), Response::HTTP_CREATED);
        self::assertSame($created['id'], $appended['id']);
        self::assertCount(2, $appended['setups']);
        self::assertCount(1, $this->entityManager->getRepository(OkiProfile::class)->findAll());

        $firstSetupId = $created['setups'][0]['id'];
        $this->request($second, 'PATCH', '/api/okis/' . $created['id'], ['moveId' => (string) $ender->getId(), 'setups' => [['id' => $firstSetupId] + $this->payload($ender, $follow)['setups'][0]]], Response::HTTP_FORBIDDEN);

        $this->request($second, 'PATCH', '/api/okis/' . $created['id'], ['moveId' => (string) $ender->getId(), 'setups' => []]);
        $this->entityManager->clear();
        $remaining = $this->entityManager->getRepository(OkiSetup::class)->findAll();
        self::assertCount(1, $remaining);
        self::assertSame($firstSetupId, $remaining[0]->getId());

        $edited = $this->request($first, 'PATCH', '/api/okis/' . $created['id'], ['moveId' => (string) $ender->getId(), 'setups' => [['id' => $firstSetupId] + $this->payload($ender, $follow)['setups'][0]]]);
        self::assertSame('pending_review', $edited['setups'][0]['moderationState']);
    }

    public function testOnlyModeratorsCanDeleteProfiles(): void
    {
        [$ender, $follow] = $this->persistMoves();
        $author = $this->createUser([UserRole::USER]);
        $moderator = $this->createUser([UserRole::MODERATOR]);
        $created = $this->request($author, 'POST', '/api/okis', $this->payload($ender, $follow), Response::HTTP_CREATED);

        $this->request($author, 'DELETE', '/api/okis/' . $created['id'], null, Response::HTTP_FORBIDDEN);
        $this->request($moderator, 'DELETE', '/api/okis/' . $created['id'], null, Response::HTTP_NO_CONTENT);
    }

    /**
     * @param array<string, mixed>|null $body
     *
     * @return array<string, mixed>
     */
    private function request(User $user, string $method, string $uri, ?array $body = null, int $expectedStatus = Response::HTTP_OK): array
    {
        if ($this->loggedInUsername !== $user->getUsername()) {
            $this->client->getCookieJar()->clear();
            $this->headers = $this->loginHeaders($user->getUsername(), 'testpassword');
            $this->loggedInUsername = $user->getUsername();
        }

        $this->client->request($method, $uri, [], [], $this->headers, null === $body ? null : json_encode($body, JSON_THROW_ON_ERROR));
        self::assertSame($expectedStatus, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $content = (string) $this->client->getResponse()->getContent();

        return $expectedStatus >= 400 || '' === $content ? [] : json_decode($content, true, 512, JSON_THROW_ON_ERROR);
    }

    /** @return array{0: Move, 1: Move} */
    private function persistMoves(): array
    {
        $character = (new Character())->setName('Ken');
        $this->entityManager->persist($character);
        $moves = [];
        foreach (['Sweep', '2MP'] as $notation) {
            $move = (new Move())->setCharacter($character)->setNumpadNotation($notation);
            $this->entityManager->persist($move);
            $moves[] = $move;
        }
        $this->entityManager->flush();

        return [$moves[0], $moves[1]];
    }

    /** @return array<string, mixed> */
    private function payload(Move $ender, Move $follow): array
    {
        return [
            'moveId' => (string) $ender->getId(),
            'setups' => [[
                'usesDriveRush' => false,
                'autoTimed' => false,
                'cornerOnly' => false,
                'worksNoBackroll' => true,
                'worksBackroll' => true,
                'fakeNoBackroll' => false,
                'fakeBackroll' => false,
                'nodes' => [['clientId' => 'a', 'moveId' => (string) $follow->getId()]],
                'links' => [],
            ]],
        ];
    }

    /** @param list<UserRole> $roles */
    private function createUser(array $roles): User
    {
        $user = (new User())
            ->setUsername(sprintf('user_%s', bin2hex(random_bytes(4))))
            ->setPassword(self::hashTestPassword())
            ->setRoles(array_map(static fn (UserRole $role): string => $role->value, $roles))
            ->setIsActive(true);
        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    /** @return array<string, string> */
    private function loginHeaders(string $username, string $password): array
    {
        $this->client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => $username,
            'password' => $password,
        ], JSON_THROW_ON_ERROR));
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        return [
            'HTTP_X_CSRF_TOKEN' => (string) $payload['csrfToken'],
            'CONTENT_TYPE' => 'application/json',
        ];
    }
}
