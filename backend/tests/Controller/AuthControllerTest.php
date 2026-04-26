<?php declare(strict_types=1);

namespace App\Tests\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Tests\DatabaseTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AuthControllerTest extends DatabaseTestCase
{
    private const TEST_USER_NAME = 'testuser';
    private const TEST_USER_PASSWORD = 'testpassword';
    private UserPasswordHasherInterface $passwordHasher;
    private UserRepository $userRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->passwordHasher = static::getContainer()->get(UserPasswordHasherInterface::class);
        $this->userRepository = $this->entityManager->getRepository(User::class);

        $testUser = $this->userRepository->findOneBy(['username' => self::TEST_USER_NAME]);
        if (null !== $testUser) {
            $this->entityManager->remove($testUser);
            $this->entityManager->flush();
        }
    }

    public function testSuccessfulLogin()
    {
        $user = new User();
        $user->setUsername(self::TEST_USER_NAME);
        $user->setPassword($this->passwordHasher->hashPassword($user, self::TEST_USER_PASSWORD));

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        $this->client->request('POST', '/api/login_check', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => self::TEST_USER_NAME,
            'password' => self::TEST_USER_PASSWORD
        ]));

        $this->assertResponseIsSuccessful();
        $this->assertNotNull(json_decode($this->client->getResponse()->getContent(), true)['token']);
    }

    public function testInvalidLogin()
    {
        $this->client->request('POST', '/api/login_check', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => 'wronguser',
            'password' => 'wrongpass'
        ]));

        $this->assertResponseStatusCodeSame(401);
    }

    public function testRegisterReturnsDefaultUserRoleMetadata(): void
    {
        $this->client->request('POST', '/api/register', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => 'newuser',
            'password' => 'newpassword',
        ]));

        $this->assertResponseStatusCodeSame(201);

        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        $this->assertSame('User registered successfully.', $payload['message'] ?? null);
        $this->assertSame('newuser', $payload['username'] ?? null);
        $this->assertSame(['ROLE_USER'], $payload['roles'] ?? null);

        $createdUser = $this->userRepository->findOneBy(['username' => 'newuser']);
        $this->assertNotNull($createdUser);
        $this->assertSame(['ROLE_USER'], $createdUser->getRoles());
    }

    public function testRegisterDoesNotBootstrapAdminAcrossMultipleUsers(): void
    {
        $this->client->request('POST', '/api/register', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => 'firstuser',
            'password' => 'firstpassword',
        ]));
        $this->assertResponseStatusCodeSame(201);

        $this->client->request('POST', '/api/register', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => 'seconduser',
            'password' => 'secondpassword',
        ]));
        $this->assertResponseStatusCodeSame(201);

        $first = $this->userRepository->findOneBy(['username' => 'firstuser']);
        $second = $this->userRepository->findOneBy(['username' => 'seconduser']);

        $this->assertNotNull($first);
        $this->assertNotNull($second);
        $this->assertSame(['ROLE_USER'], $first->getRoles());
        $this->assertSame(['ROLE_USER'], $second->getRoles());
    }

    public function testRegisterDuplicateUsernameReturnsConflict(): void
    {
        $this->client->request('POST', '/api/register', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => 'dupuser',
            'password' => 'password1',
        ]));
        $this->assertResponseStatusCodeSame(201);

        $this->client->request('POST', '/api/register', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => 'dupuser',
            'password' => 'password2',
        ]));

        $this->assertResponseStatusCodeSame(409);
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        $this->assertSame('User already exists.', $payload['message'] ?? null);
    }

    public function testRegisterRejectsInvalidPayload(): void
    {
        $this->client->request('POST', '/api/register', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => 'onlyusername',
        ]));

        $this->assertResponseStatusCodeSame(400);
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        $this->assertSame('Username and password are required.', $payload['message'] ?? null);
    }
}
