<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\User;
use App\Tests\DatabaseTestCase;
use App\Util\Enum\UserRole;
use Symfony\Component\HttpFoundation\Response;

final class ApiAuthenticationBoundaryTest extends DatabaseTestCase
{
    public function testLoginAndRegisterRemainPubliclyAccessible(): void
    {
        $this->client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'username' => 'public_register_user',
                'password' => 'testpassword',
            ])
        );

        self::assertSame(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode());

        $this->client->request(
            'POST',
            '/api/login_check',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'username' => 'public_register_user',
                'password' => 'testpassword',
            ])
        );

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
    }

    public function testProtectedApiEndpointsRequireAuthentication(): void
    {
        $this->client->request('GET', '/api/profile/me');
        self::assertSame(Response::HTTP_UNAUTHORIZED, $this->client->getResponse()->getStatusCode());

        $this->client->request('GET', '/api/posts');
        self::assertSame(Response::HTTP_UNAUTHORIZED, $this->client->getResponse()->getStatusCode());
    }

    public function testAuthenticatedUserCanAccessProtectedEndpoint(): void
    {
        $user = $this->createUser('api_boundary_user', [UserRole::USER]);
        $headers = $this->loginHeaders($user->getUsername(), 'testpassword');

        $this->client->request('GET', '/api/profile/me', [], [], $headers);
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
    }

    /**
     * @param list<UserRole> $roles
     */
    private function createUser(string $username, array $roles): User
    {
        $user = new User();
        $user->setUsername($username);
        $user->setPassword(password_hash('testpassword', PASSWORD_BCRYPT));
        $user->setRoles(array_map(static fn (UserRole $role): string => $role->value, $roles));

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    /**
     * @return array<string, string>
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
