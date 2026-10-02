<?php declare(strict_types=1);

namespace App\Tests\Command;

use App\Command\DevLoginLinkCommand;
use App\Entity\User;
use App\Tests\DatabaseTestCase;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Tester\CommandTester;
use Symfony\Component\DependencyInjection\Attribute\When;

final class DevLoginLinkCommandTest extends DatabaseTestCase
{
    private CommandTester $tester;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tester = new CommandTester(static::getContainer()->get(DevLoginLinkCommand::class));
    }

    public function testCommandIsOnlyRegisteredInDevAndTest(): void
    {
        $environments = array_map(
            static fn (\ReflectionAttribute $attribute): string => $attribute->newInstance()->env,
            (new \ReflectionClass(DevLoginLinkCommand::class))->getAttributes(When::class),
        );

        self::assertSame(['dev', 'test'], $environments);
    }

    public function testCreatedUserGetsRolesAndNoUsablePassword(): void
    {
        $this->tester->execute(['username' => 'audit_user', '--create' => true, '--role' => ['ROLE_ADMIN', 'ROLE_QA_TESTER']]);

        $this->tester->assertCommandIsSuccessful();
        $user = $this->entityManager->getRepository(User::class)->findOneBy(['username' => 'audit_user']);
        self::assertInstanceOf(User::class, $user);
        self::assertEqualsCanonicalizing(['ROLE_USER', 'ROLE_ADMIN', 'ROLE_QA_TESTER'], $user->getRoles());

        $this->client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode(['username' => 'audit_user', 'password' => '']));
        self::assertResponseStatusCodeSame(401);
    }

    public function testLoginLinkStartsASessionAndWorksOnlyOnce(): void
    {
        $this->tester->execute(['username' => 'audit_user', '--create' => true]);
        $link = $this->linkPathAndQuery(trim($this->tester->getDisplay()));

        $this->client->request('GET', $link);
        self::assertResponseIsSuccessful();
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertSame('audit_user', $payload['user']['username'] ?? null);
        self::assertIsString($payload['csrfToken'] ?? null);

        $this->client->request('GET', '/api/me');
        self::assertResponseIsSuccessful();

        $this->client->request('POST', '/api/logout', [], [], ['HTTP_X_CSRF_TOKEN' => $payload['csrfToken']]);
        $this->client->request('GET', $link);
        self::assertResponseStatusCodeSame(401);
    }

    public function testTamperedLinkIsRejected(): void
    {
        $this->tester->execute(['username' => 'audit_user', '--create' => true]);
        $link = $this->linkPathAndQuery(trim($this->tester->getDisplay()));

        $this->client->request('GET', preg_replace('/hash=[^&]+/', 'hash=forged', $link));

        self::assertResponseStatusCodeSame(401);
    }

    public function testUnknownUserFailsWithoutCreate(): void
    {
        $status = $this->tester->execute(['username' => 'missing_user']);

        self::assertSame(Command::FAILURE, $status);
        self::assertStringContainsString('does not exist', $this->tester->getDisplay());
    }

    private function linkPathAndQuery(string $url): string
    {
        $parts = parse_url($url);
        self::assertIsArray($parts);

        return ($parts['path'] ?? '') . '?' . ($parts['query'] ?? '');
    }
}
