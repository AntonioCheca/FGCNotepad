<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\User;
use App\Tests\DatabaseTestCase;
use App\Util\Enum\UserRole;
use Symfony\Component\HttpFoundation\Response;

class AdminUserManagementControllerTest extends DatabaseTestCase
{
    private int $userSeq = 1;
    private string $usernameSeed;

    protected function setUp(): void
    {
        parent::setUp();
        $this->usernameSeed = bin2hex(random_bytes(4));
    }

    public function testAdminCanListUsersWithPagination(): void
    {
        $admin = $this->createUser([UserRole::ADMIN]);
        $this->createUser([UserRole::USER]);
        $this->createUser([UserRole::MODERATOR]);

        $headers = $this->loginHeaders($admin->getUsername(), 'testpassword');
        $this->client->request('GET', '/api/admin/users?page=1&size=2', [], [], $headers);

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertSame(1, $payload['page']);
        self::assertSame(2, $payload['size']);
        self::assertGreaterThanOrEqual(3, $payload['total']);
        self::assertCount(2, $payload['data']);
    }

    public function testNonAdminCannotAccessAdminUserEndpoints(): void
    {
        $user = $this->createUser([UserRole::USER]);
        $target = $this->createUser([UserRole::USER]);
        $headers = $this->loginHeaders($user->getUsername(), 'testpassword');

        $this->client->request('GET', '/api/admin/users', [], [], $headers);
        self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());

        $this->client->request(
            'PATCH',
            sprintf('/api/admin/users/%s/roles', $target->getId()?->toRfc4122()),
            [],
            [],
            $headers,
            json_encode(['roles' => ['ROLE_MODERATOR']])
        );
        self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());
    }

    public function testAdminCanPromoteAndDemoteSafelyWithNormalizedRoles(): void
    {
        $admin = $this->createUser([UserRole::ADMIN]);
        $target = $this->createUser([UserRole::USER]);

        $headers = $this->loginHeaders($admin->getUsername(), 'testpassword');

        $this->client->request(
            'PATCH',
            sprintf('/api/admin/users/%s/roles', $target->getId()?->toRfc4122()),
            [],
            [],
            $headers,
            json_encode(['roles' => ['ROLE_MODERATOR']])
        );

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertSame(['ROLE_MODERATOR', 'ROLE_USER'], $payload['roles']);
    }

    public function testLastAdminProtectionBlocksDemotionAndDeactivation(): void
    {
        $admin = $this->createUser([UserRole::ADMIN]);
        $headers = $this->loginHeaders($admin->getUsername(), 'testpassword');

        $this->client->request(
            'PATCH',
            sprintf('/api/admin/users/%s/roles', $admin->getId()?->toRfc4122()),
            [],
            [],
            $headers,
            json_encode(['roles' => ['ROLE_USER']])
        );
        self::assertSame(Response::HTTP_CONFLICT, $this->client->getResponse()->getStatusCode());

        $this->client->request('POST', sprintf('/api/admin/users/%s/deactivate', $admin->getId()?->toRfc4122()), [], [], $headers);
        self::assertSame(Response::HTTP_CONFLICT, $this->client->getResponse()->getStatusCode());
    }

    public function testAdminCanDeactivateNonAdminAndUserCannotLoginAfterward(): void
    {
        $admin = $this->createUser([UserRole::ADMIN]);
        $target = $this->createUser([UserRole::USER]);

        $headers = $this->loginHeaders($admin->getUsername(), 'testpassword');
        $this->client->request('POST', sprintf('/api/admin/users/%s/deactivate', $target->getId()?->toRfc4122()), [], [], $headers);
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        $this->client->request(
            'POST',
            '/api/login_check',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'username' => $target->getUsername(),
                'password' => 'testpassword',
            ])
        );

        self::assertSame(Response::HTTP_UNAUTHORIZED, $this->client->getResponse()->getStatusCode());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        $message = is_array($payload) ? (string) ($payload['message'] ?? '') : '';
        self::assertStringContainsString('deactivated', mb_strtolower($message));
    }

    public function testUnauthenticatedCannotAccessAdminUserEndpoints(): void
    {
        $target = $this->createUser([UserRole::USER]);

        $this->client->request('GET', '/api/admin/users');
        self::assertSame(Response::HTTP_UNAUTHORIZED, $this->client->getResponse()->getStatusCode());

        $this->client->request(
            'PATCH',
            sprintf('/api/admin/users/%s/roles', $target->getId()?->toRfc4122()),
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['roles' => ['ROLE_MODERATOR']])
        );
        self::assertSame(Response::HTTP_UNAUTHORIZED, $this->client->getResponse()->getStatusCode());

        $this->client->request('POST', sprintf('/api/admin/users/%s/deactivate', $target->getId()?->toRfc4122()));
        self::assertSame(Response::HTTP_UNAUTHORIZED, $this->client->getResponse()->getStatusCode());
    }

    public function testAdminEndpointsReturnNotFoundForInvalidUserId(): void
    {
        $admin = $this->createUser([UserRole::ADMIN]);
        $headers = $this->loginHeaders($admin->getUsername(), 'testpassword');

        $this->client->request(
            'PATCH',
            '/api/admin/users/not-a-uuid/roles',
            [],
            [],
            $headers,
            json_encode(['roles' => ['ROLE_USER']])
        );
        self::assertSame(Response::HTTP_NOT_FOUND, $this->client->getResponse()->getStatusCode());

        $this->client->request('POST', '/api/admin/users/not-a-uuid/deactivate', [], [], $headers);
        self::assertSame(Response::HTTP_NOT_FOUND, $this->client->getResponse()->getStatusCode());
    }

    public function testAdminRoleUpdateRejectsMalformedRolePayload(): void
    {
        $admin = $this->createUser([UserRole::ADMIN]);
        $target = $this->createUser([UserRole::USER]);
        $headers = $this->loginHeaders($admin->getUsername(), 'testpassword');

        $endpoint = sprintf('/api/admin/users/%s/roles', $target->getId()?->toRfc4122());

        $this->client->request('PATCH', $endpoint, [], [], $headers, json_encode(['roles' => 'ROLE_ADMIN']));
        self::assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());

        $this->client->request('PATCH', $endpoint, [], [], $headers, json_encode(['roles' => ['ROLE_GODMODE']]));
        self::assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());
    }

    public function testDeactivatingAlreadyInactiveUserReturnsConflict(): void
    {
        $admin = $this->createUser([UserRole::ADMIN]);
        $target = $this->createUser([UserRole::USER]);
        $headers = $this->loginHeaders($admin->getUsername(), 'testpassword');
        $endpoint = sprintf('/api/admin/users/%s/deactivate', $target->getId()?->toRfc4122());

        $this->client->request('POST', $endpoint, [], [], $headers);
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        $this->client->request('POST', $endpoint, [], [], $headers);
        self::assertSame(Response::HTTP_CONFLICT, $this->client->getResponse()->getStatusCode());
    }

    /**
     * @param list<UserRole> $roles
     */
    private function createUser(array $roles): User
    {
        $user = new User();
        $user->setUsername(sprintf('user_%s_%d', $this->usernameSeed, $this->userSeq++));
        $user->setPassword(password_hash('testpassword', PASSWORD_BCRYPT));
        $user->setRoles(array_map(static fn (UserRole $role): string => $role->value, $roles));
        $user->setIsActive(true);

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    /**
     * @return array<string,string>
     */
    private function loginHeaders(string $username, string $password): array
    {
        $this->client->request(
            'POST',
            '/api/login_check',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'username' => $username,
                'password' => $password,
            ])
        );

        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);

        return [
            'HTTP_AUTHORIZATION' => sprintf('Bearer %s', (string) ($payload['token'] ?? '')),
            'CONTENT_TYPE' => 'application/json',
        ];
    }
}
