<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\Move;
use App\Entity\Post;
use App\Entity\Scenario;
use App\Entity\User;
use App\Tests\DatabaseTestCase;
use App\Util\Enum\UserRole;
use Symfony\Component\HttpFoundation\Response;

class ModerationDecisionControllerTest extends DatabaseTestCase
{
    public function testModeratorCanApprovePostAndPersistAuditFields(): void
    {
        $moderator = $this->createUser('moderator_user', [UserRole::MODERATOR]);
        $author = $this->createUser('author_user', [UserRole::USER]);
        $post = $this->createPost($author, 'pending_review');

        $headers = $this->loginHeaders($moderator->getUsername(), 'testpassword');
        $this->client->request('POST', sprintf('/api/moderation/post/%s/approve', $post->getId()?->toRfc4122()), [], [], $headers);

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertSame('approved', $payload['moderationState']);
        self::assertTrue($payload['isPubliclyVisible']);
        self::assertSame('moderator_user', $payload['moderationDecidedBy']);
        self::assertNotNull($payload['moderationDecidedAt']);

        $this->entityManager->refresh($post);
        self::assertSame('approved', $post->getModerationState());
    }

    public function testRejectAndHideRequireReason(): void
    {
        $moderator = $this->createUser('moderator_user', [UserRole::MODERATOR]);
        $author = $this->createUser('author_user', [UserRole::USER]);
        $post = $this->createPost($author, 'pending_review');
        $headers = $this->loginHeaders($moderator->getUsername(), 'testpassword');

        $this->client->request('POST', sprintf('/api/moderation/post/%s/reject', $post->getId()?->toRfc4122()), [], [], $headers, json_encode([]));
        self::assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());

        $this->client->request('POST', sprintf('/api/moderation/post/%s/hide', $post->getId()?->toRfc4122()), [], [], $headers, json_encode(['reason' => '']));
        self::assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());
    }

    public function testDuplicateDecisionReturnsConflict(): void
    {
        $moderator = $this->createUser('moderator_user', [UserRole::MODERATOR]);
        $author = $this->createUser('author_user', [UserRole::USER]);
        $post = $this->createPost($author, 'pending_review');
        $headers = $this->loginHeaders($moderator->getUsername(), 'testpassword');

        $endpoint = sprintf('/api/moderation/post/%s/approve', $post->getId()?->toRfc4122());
        $this->client->request('POST', $endpoint, [], [], $headers);
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        $this->client->request('POST', $endpoint, [], [], $headers);
        self::assertSame(Response::HTTP_CONFLICT, $this->client->getResponse()->getStatusCode());
    }

    public function testUserRoleCannotExecuteModerationDecision(): void
    {
        $user = $this->createUser('normal_user', [UserRole::USER]);
        $author = $this->createUser('author_user', [UserRole::USER]);
        $post = $this->createPost($author, 'pending_review');

        $headers = $this->loginHeaders($user->getUsername(), 'testpassword');
        $this->client->request('POST', sprintf('/api/moderation/post/%s/approve', $post->getId()?->toRfc4122()), [], [], $headers);

        self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());
    }

    public function testModeratorCanHideThenApproveScenario(): void
    {
        $moderator = $this->createUser('moderator_user', [UserRole::MODERATOR]);
        $author = $this->createUser('author_user', [UserRole::USER]);
        $scenario = $this->createScenario($author, 'approved');

        $headers = $this->loginHeaders($moderator->getUsername(), 'testpassword');
        $endpointBase = sprintf('/api/moderation/scenario/%s', $scenario->getPublicId()->toRfc4122());

        $this->client->request('POST', sprintf('%s/hide', $endpointBase), [], [], $headers, json_encode(['reason' => 'bad content']));
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        $this->client->request('POST', sprintf('%s/approve', $endpointBase), [], [], $headers);
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertSame('approved', $payload['moderationState']);
        self::assertTrue($payload['isPubliclyVisible']);
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

    private function createPost(User $author, string $state): Post
    {
        $post = new Post();
        $post->setTitle('Moderation target post');
        $post->setBody(json_encode(['content' => 'post']) ?: '{}');
        $post->setAuthor($author);
        $post->setCreatedAt(new \DateTimeImmutable());
        $post->setLastModified(new \DateTimeImmutable());
        $post->setModerationState($state);

        $this->entityManager->persist($post);
        $this->entityManager->flush();

        return $post;
    }

    private function createScenario(User $author, string $state): Scenario
    {
        $defender = (new Character())->setName('Defender');
        $attacker = (new Character())->setName('Attacker');
        $move = (new Move())->setCharacter($attacker)->setNumpadNotation('5HP');

        $scenario = (new Scenario())
            ->setName('Moderation target scenario')
            ->setScenarioType('oki')
            ->setDefenderCharacter($defender)
            ->setAttackerCharacter($attacker)
            ->setTriggerMove($move)
            ->setAuthor($author)
            ->setModerationState($state);

        $this->entityManager->persist($defender);
        $this->entityManager->persist($attacker);
        $this->entityManager->persist($move);
        $this->entityManager->persist($scenario);
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
