<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\CharacterObject;
use App\Entity\User;
use App\Tests\DatabaseTestCase;
use App\Util\Enum\UserRole;
use Symfony\Component\HttpFoundation\Response;

class CharacterResourceModerationControllerTest extends DatabaseTestCase
{
    public function testModeratorCanDefineUpdateAndDeleteAResource(): void
    {
        $character = (new Character())->setName('Manon');
        $this->entityManager->persist($character);
        $this->entityManager->flush();
        $headers = $this->loginHeaders($this->createUser('moderator_user', [UserRole::MODERATOR])->getUsername());

        $created = $this->request('POST', '/api/moderation/resources', $headers, [
            'character_id' => $character->getId()?->toRfc4122(),
            'name' => 'Medals',
            'kind' => 'scaler',
            'spend_behavior' => 'maintained',
            'starts_with' => 1,
            'max_status' => 5,
            'resets_each_round' => false,
            'extractor_key' => 'medals',
        ], Response::HTTP_CREATED);

        self::assertSame('manon_medals', $created['object_key']);
        self::assertSame('Manon - Medals', $created['display_name']);
        self::assertSame('scaler', $created['kind']);
        self::assertSame('integer', $created['status_type']);
        self::assertSame(1, $created['starts_with']);
        self::assertFalse($created['can_be_consumed']);

        $updated = $this->request('PATCH', '/api/moderation/resources/' . $created['id'], $headers, ['starts_with' => 2, 'resets_each_round' => true], Response::HTTP_OK);
        self::assertSame(2, $updated['starts_with']);
        self::assertTrue($updated['resets_each_round']);
        self::assertSame('medals', $updated['extractor_key']);

        $list = $this->request('GET', '/api/moderation/resources?characterName=Manon', $headers, null, Response::HTTP_OK);
        self::assertCount(1, $list['resources']);

        $this->client->request('DELETE', '/api/moderation/resources/' . $created['id'], [], [], $headers);
        self::assertSame(Response::HTTP_NO_CONTENT, $this->client->getResponse()->getStatusCode());
        self::assertNull($this->entityManager->getRepository(CharacterObject::class)->find($created['id']));
    }

    public function testStartValueMustFitTheConfiguredRange(): void
    {
        $character = (new Character())->setName('Blanka');
        $this->entityManager->persist($character);
        $this->entityManager->flush();
        $headers = $this->loginHeaders($this->createUser('moderator_user', [UserRole::MODERATOR])->getUsername());

        $error = $this->request('POST', '/api/moderation/resources', $headers, [
            'character_id' => $character->getId()?->toRfc4122(),
            'name' => 'Blanka-chans',
            'kind' => 'stock',
            'starts_with' => 4,
            'max_status' => 3,
        ], Response::HTTP_BAD_REQUEST);

        self::assertStringContainsString('starts_with', $error['error']);
    }

    public function testInstallResourcesAreOnOffAndKeyIsUniquePerCharacter(): void
    {
        $character = (new Character())->setName('Kimberly');
        $this->entityManager->persist($character);
        $this->entityManager->flush();
        $headers = $this->loginHeaders($this->createUser('moderator_user', [UserRole::MODERATOR])->getUsername());
        $payload = ['character_id' => $character->getId()?->toRfc4122(), 'name' => 'Install', 'kind' => 'state', 'extractor_source' => 'install', 'starts_with' => 5];

        $first = $this->request('POST', '/api/moderation/resources', $headers, $payload, Response::HTTP_CREATED);
        $second = $this->request('POST', '/api/moderation/resources', $headers, $payload, Response::HTTP_CREATED);

        self::assertSame('boolean', $first['status_type']);
        self::assertSame(1, $first['starts_with']);
        self::assertSame('kimberly_install', $first['object_key']);
        self::assertSame('kimberly_install_2', $second['object_key']);
    }

    public function testNormalUserCannotManageResources(): void
    {
        $headers = $this->loginHeaders($this->createUser('normal_user', [UserRole::USER])->getUsername());

        $this->client->request('GET', '/api/moderation/resources', [], [], $headers);

        self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());
    }

    /**
     * @param array<string, string> $headers
     * @param array<string, mixed>|null $body
     *
     * @return array<string, mixed>
     */
    private function request(string $method, string $uri, array $headers, ?array $body, int $expectedStatus): array
    {
        $this->client->request($method, $uri, [], [], $headers, null === $body ? null : json_encode($body));
        self::assertSame($expectedStatus, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());

        return json_decode((string) $this->client->getResponse()->getContent(), true) ?? [];
    }

    /** @param list<UserRole> $roles */
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

    /** @return array<string, string> */
    private function loginHeaders(string $username): array
    {
        $this->client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode(['username' => $username, 'password' => 'testpassword']));
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);

        return ['HTTP_X_CSRF_TOKEN' => (string) ($payload['csrfToken'] ?? ''), 'CONTENT_TYPE' => 'application/json'];
    }
}
