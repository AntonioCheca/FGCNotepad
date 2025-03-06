<?php declare(strict_types=1);

namespace App\Tests\Controller;

use App\Entity\User;
use App\Tests\DatabaseTestCase;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;

abstract class AuthenticatedWebTestCase extends DatabaseTestCase
{
    private string $jwtToken = '';
    private array $headers = [];

    protected function createAuthenticatedClient(): KernelBrowser
    {
        $user = $this->entityManager->getRepository(User::class)->findOneBy(['username' => 'testuser']);
        if (!$user) {
            $user = new User();
            $user->setUsername('testuser');
            $user->setPassword(password_hash('testpassword', PASSWORD_BCRYPT)); // Hash password
            $this->entityManager->persist($user);
            $this->entityManager->flush();
        }

        $this->client->request('POST', '/api/login_check', [], [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'username' => 'testuser',
                'password' => 'testpassword'
            ])
        );

        $this->assertResponseIsSuccessful();
        $this->jwtToken = json_decode($this->client->getResponse()->getContent(), true)['token'];

        return $this->client;
    }

    public function setUp(): void
    {
        parent::setUp();
        $this->client = $this->createAuthenticatedClient();
        $this->addAuthorizationToHeaders();
    }

    protected function addAuthorizationToHeaders(): void
    {
        if ('' !== $this->jwtToken) {
            $this->headers['HTTP_Authorization'] = sprintf('Bearer %s', $this->jwtToken);
        }
    }

    protected function addContentTypeJsonToHeaders(): void
    {
        $this->headers['CONTENT_TYPE'] = 'json';
    }

    protected function getHeaders(): array
    {
        return $this->headers;
    }
}
