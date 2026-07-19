<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\Move;
use App\Entity\Scenario;
use App\Entity\ScenarioFlag;
use App\Entity\User;
use App\Tests\DatabaseTestCase;
use App\Util\Enum\UserRole;
use Symfony\Component\HttpFoundation\Response;

class ModerationQueueControllerTest extends DatabaseTestCase
{
    public function testModeratorAndAdminCanFetchQueue(): void
    {
        $moderator = $this->createUser('moderator_user', [UserRole::MODERATOR]);
        $admin = $this->createUser('admin_user', [UserRole::ADMIN]);
        $author = $this->createUser('author_user', [UserRole::USER]);

        $this->createScenario($author, 'Pending Scenario', 'pending_review');

        $moderatorHeaders = $this->loginHeaders($moderator->getUsername(), 'testpassword');
        $this->client->request('GET', '/api/moderation/queue', [], [], $moderatorHeaders);
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        $adminHeaders = $this->loginHeaders($admin->getUsername(), 'testpassword');
        $this->client->request('GET', '/api/moderation/queue', [], [], $adminHeaders);
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
    }

    public function testUserCannotFetchQueue(): void
    {
        $user = $this->createUser('normal_user', [UserRole::USER]);
        $headers = $this->loginHeaders($user->getUsername(), 'testpassword');

        $this->client->request('GET', '/api/moderation/queue', [], [], $headers);

        self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());
    }

    public function testQueueFiltersByContentTypeStateAndSortAndReturnsStableShape(): void
    {
        $moderator = $this->createUser('moderator_user', [UserRole::MODERATOR]);
        $author = $this->createUser('author_user', [UserRole::USER]);
        $reporter = $this->createUser('reporter_user', [UserRole::USER]);

        $oldScenario = $this->createScenario($author, 'Older Pending Scenario', 'pending_review', new \DateTimeImmutable('-3 days'));
        $newScenario = $this->createScenario($author, 'Newer Pending Scenario', 'pending_review', new \DateTimeImmutable('-1 day'));
        $flaggedScenario = $this->createApprovedFlaggedScenario($author, $reporter);

        $headers = $this->loginHeaders($moderator->getUsername(), 'testpassword');

        $this->client->request(
            'GET',
            '/api/moderation/queue?contentType=scenario&state=pending_review&sort=oldest',
            [],
            [],
            $headers
        );
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);

        self::assertIsArray($payload['data'] ?? null);
        self::assertCount(2, $payload['data']);
        self::assertSame($oldScenario->getPublicId()->toRfc4122(), $payload['data'][0]['contentId']);
        self::assertSame($newScenario->getPublicId()->toRfc4122(), $payload['data'][1]['contentId']);

        $row = $payload['data'][0];
        self::assertArrayHasKey('contentId', $row);
        self::assertArrayHasKey('contentType', $row);
        self::assertArrayHasKey('title', $row);
        self::assertArrayHasKey('author', $row);
        self::assertArrayHasKey('state', $row);
        self::assertArrayHasKey('createdAt', $row);
        self::assertArrayHasKey('updatedAt', $row);
        self::assertArrayHasKey('flagCount', $row);

        $this->client->request('GET', '/api/moderation/queue?contentType=scenario&state=flagged', [], [], $headers);
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $flaggedPayload = json_decode((string) $this->client->getResponse()->getContent(), true);

        self::assertCount(1, $flaggedPayload['data']);
        self::assertSame('scenario', $flaggedPayload['data'][0]['contentType']);
        self::assertSame($flaggedScenario->getPublicId()->toRfc4122(), $flaggedPayload['data'][0]['contentId']);
        self::assertGreaterThan(0, (int) $flaggedPayload['data'][0]['flagCount']);
    }

    public function testUnauthenticatedCannotFetchQueue(): void
    {
        $this->client->request('GET', '/api/moderation/queue');

        self::assertSame(Response::HTTP_UNAUTHORIZED, $this->client->getResponse()->getStatusCode());
    }

    public function testQueueRejectsInvalidFilters(): void
    {
        $moderator = $this->createUser('moderator_user', [UserRole::MODERATOR]);
        $headers = $this->loginHeaders($moderator->getUsername(), 'testpassword');

        $this->client->request('GET', '/api/moderation/queue?contentType=invalid_type', [], [], $headers);
        self::assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());

        $this->client->request('GET', '/api/moderation/queue?state=bad_state', [], [], $headers);
        self::assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());

        $this->client->request('GET', '/api/moderation/queue?sort=sideways', [], [], $headers);
        self::assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());
    }

    public function testQueueAcceptsCommaSeparatedFilters(): void
    {
        $moderator = $this->createUser('moderator_user', [UserRole::MODERATOR]);
        $author = $this->createUser('author_user', [UserRole::USER]);
        $reporter = $this->createUser('reporter_user', [UserRole::USER]);

        $pendingScenario = $this->createScenario($author, 'Pending Scenario CSV', 'pending_review');
        $flaggedScenario = $this->createApprovedFlaggedScenario($author, $reporter);

        $headers = $this->loginHeaders($moderator->getUsername(), 'testpassword');
        $this->client->request(
            'GET',
            '/api/moderation/queue?contentType=scenario&state=pending_review,flagged&sort=oldest',
            [],
            [],
            $headers
        );

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertCount(2, $payload['data']);

        $contentIds = array_map(static fn (array $row): string => (string) $row['contentId'], $payload['data']);
        self::assertContains($pendingScenario->getPublicId()->toRfc4122(), $contentIds);
        self::assertContains($flaggedScenario->getPublicId()->toRfc4122(), $contentIds);
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

    private function createScenario(User $author, string $name, string $state, ?\DateTimeImmutable $createdAt = null): Scenario
    {
        $defender = (new Character())->setName(sprintf('%s Defender', $name));
        $attacker = (new Character())->setName(sprintf('%s Attacker', $name));
        $move = (new Move())->setCharacter($attacker)->setNumpadNotation('5HP');
        $createdAt ??= new \DateTimeImmutable();

        $scenario = (new Scenario())
            ->setName($name)
            ->setScenarioType('oki')
            ->setDefenderCharacter($defender)
            ->setAttackerCharacter($attacker)
            ->setTriggerMove($move)
            ->setAuthor($author)
            ->setCreatedAt($createdAt)
            ->setUpdatedAt($createdAt)
            ->setModerationState($state);

        $this->entityManager->persist($defender);
        $this->entityManager->persist($attacker);
        $this->entityManager->persist($move);
        $this->entityManager->persist($scenario);
        $this->entityManager->flush();

        return $scenario;
    }

    private function createApprovedFlaggedScenario(User $author, User $reporter): Scenario
    {
        $scenario = $this->createScenario($author, 'Flagged Scenario', 'approved');
        $flag = new ScenarioFlag($scenario, $reporter, 'Needs review');

        $this->entityManager->persist($flag);
        $this->entityManager->flush();

        return $scenario;
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
