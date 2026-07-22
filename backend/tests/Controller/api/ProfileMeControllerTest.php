<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\User;
use App\Tests\DatabaseTestCase;
use App\Util\Enum\UserRole;
use Symfony\Component\HttpFoundation\Response;

class ProfileMeControllerTest extends DatabaseTestCase
{
    public function testMeRequiresAuthentication(): void
    {
        $this->client->request('GET', '/api/profile/me');

        self::assertSame(Response::HTTP_UNAUTHORIZED, $this->client->getResponse()->getStatusCode());
    }

    public function testMeReturnsCurrentUserIdentityAndRoles(): void
    {
        $user = new User();
        $user->setUsername('profile_me_user');
        $user->setPassword(self::hashTestPassword());
        $user->setRoles([UserRole::ADMIN->value]);

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        $headers = $this->loginHeaders('profile_me_user', 'testpassword');
        $this->client->request('GET', '/api/profile/me', [], [], $headers);

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);

        self::assertSame('profile_me_user', $payload['username'] ?? null);
        self::assertSame($user->getId()?->toRfc4122(), $payload['id'] ?? null);
        self::assertSame(true, $payload['isActive'] ?? null);
        self::assertContains(UserRole::ADMIN->value, $payload['roles'] ?? []);
        self::assertContains(UserRole::USER->value, $payload['roles'] ?? []);
    }

    /**
     * @return array<string,string>
     */
    private function loginHeaders(string $username, string $password): array
    {
        $this->client->request(
            'POST',
            '/api/login',
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
            'HTTP_X_CSRF_TOKEN' => (string) ($payload['csrfToken'] ?? ''),
            'CONTENT_TYPE' => 'application/json',
        ];
    }
}
