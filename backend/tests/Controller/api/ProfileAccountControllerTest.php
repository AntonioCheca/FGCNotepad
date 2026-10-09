<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\User;
use App\Service\TermsAcceptanceService;
use App\Tests\DatabaseTestCase;
use Symfony\Component\HttpFoundation\Response;

class ProfileAccountControllerTest extends DatabaseTestCase
{
    public function testAccountEndpointsRequireAuthentication(): void
    {
        foreach (['/api/profile/terms-acceptance', '/api/profile/deletion-request'] as $path) {
            $this->client->request('POST', $path);

            self::assertSame(Response::HTTP_UNAUTHORIZED, $this->client->getResponse()->getStatusCode());
        }
    }

    public function testExistingUserWithoutAcceptanceCanAcceptCurrentTerms(): void
    {
        $user = $this->createUser('terms_legacy_user');
        $headers = $this->loginHeaders('terms_legacy_user');

        $this->client->request('GET', '/api/me');
        self::assertFalse($this->jsonResponse()['user']['hasAcceptedCurrentTerms'] ?? null);

        $this->client->request('POST', '/api/profile/terms-acceptance', [], [], $headers);

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        self::assertTrue($this->jsonResponse()['user']['hasAcceptedCurrentTerms'] ?? null);

        $this->entityManager->refresh($user);
        self::assertSame(TermsAcceptanceService::CURRENT_VERSION, $user->getTermsVersion());
        self::assertNotNull($user->getTermsAcceptedAt());

        $this->client->request('GET', '/api/me');
        self::assertTrue($this->jsonResponse()['user']['hasAcceptedCurrentTerms'] ?? null);
    }

    public function testDeletionRequestDeactivatesAccountAndEndsSession(): void
    {
        $user = $this->createUser('deletion_request_user');
        $headers = $this->loginHeaders('deletion_request_user');

        $this->client->request('POST', '/api/profile/deletion-request', [], [], $headers);

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $this->entityManager->refresh($user);
        self::assertFalse($user->isActive());
        self::assertNotNull($user->getDeactivatedAt());
        self::assertNotNull($user->getDeletionRequestedAt());

        $this->client->request('GET', '/api/me');
        self::assertSame(Response::HTTP_UNAUTHORIZED, $this->client->getResponse()->getStatusCode());

        $this->requestLogin('deletion_request_user');
        self::assertSame(Response::HTTP_UNAUTHORIZED, $this->client->getResponse()->getStatusCode());
    }

    private function createUser(string $username): User
    {
        $user = (new User())
            ->setUsername($username)
            ->setPassword(self::hashTestPassword())
            ->setRoles([])
            ->setIsActive(true);

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    /**
     * @return array<string,string>
     */
    private function loginHeaders(string $username): array
    {
        $this->requestLogin($username);
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        return [
            'HTTP_X_CSRF_TOKEN' => (string) ($this->jsonResponse()['csrfToken'] ?? ''),
            'CONTENT_TYPE' => 'application/json',
        ];
    }

    private function requestLogin(string $username): void
    {
        $this->client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => $username,
            'password' => 'testpassword',
        ]));
    }

    /**
     * @return array<string,mixed>
     */
    private function jsonResponse(): array
    {
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);

        return is_array($payload) ? $payload : [];
    }
}
