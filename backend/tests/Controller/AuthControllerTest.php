<?php declare(strict_types=1);

namespace App\Tests\Controller;

use App\Controller\AuthController;
use App\Repository\RegistrationInviteCodeRepository;
use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\RegistrationInviteCodeService;
use App\Service\RegistrationService;
use App\Tests\DatabaseTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AuthControllerTest extends DatabaseTestCase
{
    private const TEST_USER_NAME = 'testuser';
    private const TEST_USER_PASSWORD = 'testpassword';
    private UserPasswordHasherInterface $passwordHasher;
    private UserRepository $userRepository;
    private string $usernameSeed;
    private int $usernameSeq = 1;

    protected function setUp(): void
    {
        parent::setUp();
        $this->usernameSeed = bin2hex(random_bytes(4));
        $this->usernameSeq = 1;
        $this->passwordHasher = static::getContainer()->get(UserPasswordHasherInterface::class);
        $this->userRepository = $this->entityManager->getRepository(User::class);

        $testUser = $this->userRepository->findOneBy(['username' => self::TEST_USER_NAME]);
        if (null !== $testUser) {
            $this->entityManager->remove($testUser);
            $this->entityManager->flush();
        }
    }

    public function testSuccessfulLogin(): void
    {
        $user = new User();
        $user->setUsername(self::TEST_USER_NAME);
        $user->setPassword($this->passwordHasher->hashPassword($user, self::TEST_USER_PASSWORD));

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        $this->client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => self::TEST_USER_NAME,
            'password' => self::TEST_USER_PASSWORD
        ]));

        $this->assertResponseIsSuccessful();
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertSame(self::TEST_USER_NAME, $payload['user']['username'] ?? null);
        self::assertIsString($payload['csrfToken'] ?? null);
        self::assertArrayNotHasKey('token', $payload);
    }

    public function testInvalidLogin(): void
    {
        $this->client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => 'wronguser',
            'password' => 'wrongpass'
        ]));

        $this->assertResponseStatusCodeSame(401);
    }

    public function testBrowserLoginRejectsNonStringPasswordPayload(): void
    {
        $this->client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => self::TEST_USER_NAME,
            'password' => ['not', 'a', 'string'],
        ]));

        $this->assertResponseStatusCodeSame(400);
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        $this->assertSame('Username and password must be strings.', $payload['message'] ?? null);
    }

    public function testBrowserSessionLoginReturnsUserAndNoToken(): void
    {
        $this->createPasswordUser(self::TEST_USER_NAME, self::TEST_USER_PASSWORD);

        $this->client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => self::TEST_USER_NAME,
            'password' => self::TEST_USER_PASSWORD,
        ]));

        $this->assertResponseIsSuccessful();
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);

        self::assertSame(self::TEST_USER_NAME, $payload['user']['username'] ?? null);
        self::assertSame(['ROLE_USER'], $payload['user']['roles'] ?? null);
        self::assertIsString($payload['csrfToken'] ?? null);
        self::assertArrayNotHasKey('token', $payload);
        self::assertArrayNotHasKey('refresh_token', $payload);
    }

    public function testBrowserSessionMeRequiresAuthentication(): void
    {
        $this->client->request('GET', '/api/me');

        $this->assertResponseStatusCodeSame(401);
    }

    public function testBrowserSessionCanAccessMeAfterLogin(): void
    {
        $this->createPasswordUser(self::TEST_USER_NAME, self::TEST_USER_PASSWORD);
        $this->loginBrowserSession(self::TEST_USER_NAME, self::TEST_USER_PASSWORD);

        $this->client->request('GET', '/api/me');

        $this->assertResponseIsSuccessful();
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertTrue($payload['authenticated'] ?? false);
        self::assertSame(self::TEST_USER_NAME, $payload['user']['username'] ?? null);
        self::assertIsString($payload['csrfToken'] ?? null);
    }

    public function testBrowserSessionUnsafeRequestRequiresCsrfToken(): void
    {
        $this->createPasswordUser(self::TEST_USER_NAME, self::TEST_USER_PASSWORD);
        $this->loginBrowserSession(self::TEST_USER_NAME, self::TEST_USER_PASSWORD);

        $this->client->request('PUT', '/api/profile/notation-preference', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'notationDictionary' => 'numpad',
        ]));

        $this->assertResponseStatusCodeSame(403);
    }

    public function testBrowserSessionUnsafeRequestAcceptsValidCsrfToken(): void
    {
        $this->createPasswordUser(self::TEST_USER_NAME, self::TEST_USER_PASSWORD);
        $csrfToken = $this->loginBrowserSession(self::TEST_USER_NAME, self::TEST_USER_PASSWORD);

        $this->client->request('PUT', '/api/profile/notation-preference', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_CSRF_TOKEN' => $csrfToken,
        ], json_encode([
            'notationDictionary' => 'numpad',
        ]));

        $this->assertResponseIsSuccessful();
    }

    public function testBrowserLogoutInvalidatesSession(): void
    {
        $this->createPasswordUser(self::TEST_USER_NAME, self::TEST_USER_PASSWORD);
        $csrfToken = $this->loginBrowserSession(self::TEST_USER_NAME, self::TEST_USER_PASSWORD);

        $this->client->request('POST', '/api/logout', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_CSRF_TOKEN' => $csrfToken,
        ]);
        $this->assertResponseIsSuccessful();

        $this->client->request('GET', '/api/me');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testRegisterReturnsDefaultUserRoleMetadata(): void
    {
        $username = $this->nextUsername('newuser');
        $this->client->request('POST', '/api/register', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => $username,
            'password' => 'newpassword',
        ]));

        $this->assertResponseStatusCodeSame(201);

        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        $this->assertSame('User registered successfully.', $payload['message'] ?? null);
        $this->assertSame($username, $payload['username'] ?? null);
        $this->assertSame(['ROLE_USER'], $payload['roles'] ?? null);

        $createdUser = $this->userRepository->findOneBy(['username' => $username]);
        $this->assertNotNull($createdUser);
        $this->assertSame(['ROLE_USER'], $createdUser->getRoles());
    }

    public function testRegisterDoesNotBootstrapAdminAcrossMultipleUsers(): void
    {
        $firstUsername = $this->nextUsername('firstuser');
        $secondUsername = $this->nextUsername('seconduser');
        $this->client->request('POST', '/api/register', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => $firstUsername,
            'password' => 'firstpassword',
        ]));
        $this->assertResponseStatusCodeSame(201);

        $this->client->request('POST', '/api/register', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => $secondUsername,
            'password' => 'secondpassword',
        ]));
        $this->assertResponseStatusCodeSame(201);

        $first = $this->userRepository->findOneBy(['username' => $firstUsername]);
        $second = $this->userRepository->findOneBy(['username' => $secondUsername]);

        $this->assertNotNull($first);
        $this->assertNotNull($second);
        $this->assertSame(['ROLE_USER'], $first->getRoles());
        $this->assertSame(['ROLE_USER'], $second->getRoles());
    }

    public function testRegisterDuplicateUsernameReturnsConflict(): void
    {
        $username = $this->nextUsername('dupuser');
        $this->client->request('POST', '/api/register', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => $username,
            'password' => 'password1',
        ]));
        $this->assertResponseStatusCodeSame(201);

        $this->client->request('POST', '/api/register', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => $username,
            'password' => 'password2',
        ]));

        $this->assertResponseStatusCodeSame(409);
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        $this->assertSame('User already exists.', $payload['message'] ?? null);
    }

    public function testRegisterRejectsInvalidPayload(): void
    {
        $username = $this->nextUsername('onlyusername');
        $this->client->request('POST', '/api/register', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => $username,
        ]));

        $this->assertResponseStatusCodeSame(400);
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        $this->assertSame('Username and password are required.', $payload['message'] ?? null);
    }

    public function testRegistrationInviteCodeIsMarkedUsedWhenRegistrationSucceeds(): void
    {
        $inviteCodeService = static::getContainer()->get(RegistrationInviteCodeService::class);
        $registrationService = static::getContainer()->get(RegistrationService::class);
        $inviteCodeRepository = static::getContainer()->get(RegistrationInviteCodeRepository::class);
        $result = $inviteCodeService->createInviteCode('alpha tester');
        $inviteCode = $result['inviteCode'];

        self::assertFalse($inviteCode->isUsed());

        $user = $registrationService->register($this->nextUsername('inviteduser'), 'newpassword', $inviteCode);
        $this->entityManager->refresh($inviteCode);

        self::assertTrue($inviteCode->isUsed());
        self::assertSame($user->getId()?->toRfc4122(), $inviteCode->getUsedBy()?->getId()?->toRfc4122());
        self::assertNotNull($inviteCode->getUsedAt());
        self::assertNull($inviteCodeRepository->findUnusedByCodeHash($inviteCode->getCodeHash()));
    }

    private function nextUsername(string $prefix): string
    {
        return sprintf('%s_%s_%d', $prefix, $this->usernameSeed, $this->usernameSeq++);
    }

    private function createPasswordUser(string $username, string $password): User
    {
        $user = new User();
        $user->setUsername($username);
        $user->setPassword($this->passwordHasher->hashPassword($user, $password));

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    private function loginBrowserSession(string $username, string $password): string
    {
        $this->client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => $username,
            'password' => $password,
        ]));

        $this->assertResponseIsSuccessful();
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);

        return (string) ($payload['csrfToken'] ?? '');
    }
}
