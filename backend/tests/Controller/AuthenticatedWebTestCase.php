<?php declare(strict_types=1);

namespace App\Tests\Controller;

use App\Entity\User;
use App\Tests\DatabaseTestCase;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;

abstract class AuthenticatedWebTestCase extends DatabaseTestCase
{
    private array $headers = [];

    protected function createAuthenticatedClient(): KernelBrowser
    {
        $user = $this->entityManager->getRepository(User::class)->findOneBy(['username' => 'testuser']);
        if (!$user) {
            $user = new User();
            $user->setUsername('testuser');
            $user->setPassword(password_hash('testpassword', PASSWORD_BCRYPT));
            $user->setIsActive(true);
            $this->entityManager->persist($user);
        } else {
            $user->setPassword(password_hash('testpassword', PASSWORD_BCRYPT));
            $user->setIsActive(true);
        }

        $this->entityManager->flush();

        $this->client->request('POST', '/api/login', [], [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'username' => 'testuser',
                'password' => 'testpassword'
            ])
        );

        $this->assertResponseIsSuccessful();
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        $this->headers['HTTP_X_CSRF_TOKEN'] = (string) ($payload['csrfToken'] ?? '');

        return $this->client;
    }

    public function setUp(): void
    {
        parent::setUp();
        $this->client = $this->createAuthenticatedClient();
    }

    protected function addContentTypeJsonToHeaders(): void
    {
        $this->headers['HTTP_CONTENT_TYPE'] = 'application/json';
    }

    protected function addExpectedTypeJsonToHeaders(): void
    {
        $this->headers['HTTP_ACCEPT'] = 'application/json';
    }

    protected function getHeaders(): array
    {
        return $this->headers;
    }
}
