<?php declare(strict_types=1);

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AuthControllerTest extends WebTestCase
{
    private $client;
    private $entityManager;
    private $passwordHasher;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->entityManager = static::getContainer()->get(EntityManagerInterface::class);
        $this->passwordHasher = static::getContainer()->get(UserPasswordHasherInterface::class);
    }

    public function testSuccessfulLogin()
    {
        $user = new User();
        $user->setUsername("testuser");
        $user->setPassword($this->passwordHasher->hashPassword($user, "testpass"));

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        $this->client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => 'testuser',
            'password' => 'testpass'
        ]));

        $this->assertResponseIsSuccessful();
        $this->assertJsonStringEqualsJsonString(json_encode(['message' => 'Login successful']), $this->client->getResponse()->getContent());
    }

    public function testInvalidLogin()
    {
        $this->client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => 'wronguser',
            'password' => 'wrongpass'
        ]));

        $this->assertResponseStatusCodeSame(401);
    }
}
