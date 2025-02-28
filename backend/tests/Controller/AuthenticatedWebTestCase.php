<?php declare(strict_types=1);

namespace App\Tests\Controller;

use App\Tests\DatabaseTestCase;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

abstract class AuthenticatedWebTestCase extends DatabaseTestCase
{
    protected function createAuthenticatedClient(): object
    {
        $user = $this->entityManager->getRepository(User::class)->findOneBy(['username' => 'testuser']);
        if (!$user) {
            $user = new User();
            $user->setUsername('testuser');
            $user->setPassword(password_hash('testpassword', PASSWORD_BCRYPT)); // Hash password
            $this->entityManager->persist($user);
            $this->entityManager->flush();
        }

        $this->client->request('POST', '/api/login', [], [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'username' => 'testuser',
                'password' => 'testpassword'
            ])
        );

        $this->assertResponseIsSuccessful();

        return $this->client;
    }
}
