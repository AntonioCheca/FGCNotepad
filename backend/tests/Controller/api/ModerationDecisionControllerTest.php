<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\Move;
use App\Entity\Scenario;
use App\Entity\User;
use App\Tests\DatabaseTestCase;
use App\Util\Enum\UserRole;
use Symfony\Component\HttpFoundation\Response;

class ModerationDecisionControllerTest extends DatabaseTestCase
{
    public function testModeratorCanApproveScenarioAndPersistAuditFields(): void
    {
        $moderator = $this->createUser('moderator_user', [UserRole::MODERATOR]);
        $author = $this->createUser('author_user', [UserRole::USER]);
        $scenario = $this->createScenario($author, 'pending_review');

        $headers = $this->loginHeaders($moderator->getUsername(), 'testpassword');
        $this->client->request('POST', sprintf('/api/moderation/scenario/%s/approve', $scenario->getPublicId()->toRfc4122()), [], [], $headers);

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertSame('approved', $payload['moderationState']);
        self::assertTrue($payload['isPubliclyVisible']);
        self::assertSame('moderator_user', $payload['moderationDecidedBy']);
        self::assertNotNull($payload['moderationDecidedAt']);

        $this->entityManager->refresh($scenario);
        self::assertSame('approved', $scenario->getModerationState());
    }

    public function testRejectAndHideRequireReason(): void
    {
        $moderator = $this->createUser('moderator_user', [UserRole::MODERATOR]);
        $author = $this->createUser('author_user', [UserRole::USER]);
        $scenario = $this->createScenario($author, 'pending_review');
        $headers = $this->loginHeaders($moderator->getUsername(), 'testpassword');

        $endpointBase = sprintf('/api/moderation/scenario/%s', $scenario->getPublicId()->toRfc4122());
        $this->client->request('POST', sprintf('%s/reject', $endpointBase), [], [], $headers, json_encode([]));
        self::assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());

        $this->client->request('POST', sprintf('%s/hide', $endpointBase), [], [], $headers, json_encode(['reason' => '']));
        self::assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());
    }

    public function testDuplicateDecisionReturnsConflict(): void
    {
        $moderator = $this->createUser('moderator_user', [UserRole::MODERATOR]);
        $author = $this->createUser('author_user', [UserRole::USER]);
        $scenario = $this->createScenario($author, 'pending_review');
        $headers = $this->loginHeaders($moderator->getUsername(), 'testpassword');

        $endpoint = sprintf('/api/moderation/scenario/%s/approve', $scenario->getPublicId()->toRfc4122());
        $this->client->request('POST', $endpoint, [], [], $headers);
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        $this->client->request('POST', $endpoint, [], [], $headers);
        self::assertSame(Response::HTTP_CONFLICT, $this->client->getResponse()->getStatusCode());
    }

    public function testUserRoleCannotExecuteModerationDecision(): void
    {
        $user = $this->createUser('normal_user', [UserRole::USER]);
        $author = $this->createUser('author_user', [UserRole::USER]);
        $scenario = $this->createScenario($author, 'pending_review');

        $headers = $this->loginHeaders($user->getUsername(), 'testpassword');
        $this->client->request('POST', sprintf('/api/moderation/scenario/%s/approve', $scenario->getPublicId()->toRfc4122()), [], [], $headers);

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

    public function testUnauthenticatedCannotExecuteModerationDecisions(): void
    {
        $author = $this->createUser('author_user', [UserRole::USER]);
        $scenario = $this->createScenario($author, 'pending_review');
        $endpointBase = sprintf('/api/moderation/scenario/%s', $scenario->getPublicId()->toRfc4122());

        $this->client->request('POST', sprintf('%s/approve', $endpointBase));
        self::assertSame(Response::HTTP_UNAUTHORIZED, $this->client->getResponse()->getStatusCode());

        $this->client->request('POST', sprintf('%s/reject', $endpointBase), [], [], ['CONTENT_TYPE' => 'application/json'], json_encode(['reason' => 'x']));
        self::assertSame(Response::HTTP_UNAUTHORIZED, $this->client->getResponse()->getStatusCode());

        $this->client->request('POST', sprintf('%s/hide', $endpointBase), [], [], ['CONTENT_TYPE' => 'application/json'], json_encode(['reason' => 'x']));
        self::assertSame(Response::HTTP_UNAUTHORIZED, $this->client->getResponse()->getStatusCode());
    }

    public function testDecisionReturnsNotFoundForUnsupportedType(): void
    {
        $moderator = $this->createUser('moderator_user', [UserRole::MODERATOR]);
        $headers = $this->loginHeaders($moderator->getUsername(), 'testpassword');

        $this->client->request('POST', '/api/moderation/unknown/1/approve', [], [], $headers);
        self::assertSame(Response::HTTP_NOT_FOUND, $this->client->getResponse()->getStatusCode());
    }

    public function testDecisionReturnsNotFoundForInvalidIdentifiers(): void
    {
        $moderator = $this->createUser('moderator_user', [UserRole::MODERATOR]);
        $headers = $this->loginHeaders($moderator->getUsername(), 'testpassword');

        $this->client->request('POST', '/api/moderation/combo/not-numeric/approve', [], [], $headers);
        self::assertSame(Response::HTTP_NOT_FOUND, $this->client->getResponse()->getStatusCode());

        $this->client->request('POST', '/api/moderation/scenario/not-a-uuid/approve', [], [], $headers);
        self::assertSame(Response::HTTP_NOT_FOUND, $this->client->getResponse()->getStatusCode());
    }

    public function testDecisionReturnsBadRequestForInvalidCurrentModerationState(): void
    {
        $moderator = $this->createUser('moderator_user', [UserRole::MODERATOR]);
        $author = $this->createUser('author_user', [UserRole::USER]);
        $scenario = $this->createScenario($author, 'invalid_state');

        $headers = $this->loginHeaders($moderator->getUsername(), 'testpassword');
        $this->client->request('POST', sprintf('/api/moderation/scenario/%s/approve', $scenario->getPublicId()->toRfc4122()), [], [], $headers);

        self::assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertSame('Invalid current moderation state.', $payload['error'] ?? null);
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

    private function createScenario(User $author, string $state): Scenario
    {
        $defender = (new Character())->setName(sprintf('Defender %s', uniqid('', true)));
        $attacker = (new Character())->setName(sprintf('Attacker %s', uniqid('', true)));
        $move = (new Move())->setCharacter($attacker)->setNumpadNotation('5HP');

        $scenario = (new Scenario())
            ->setName(sprintf('Moderation target scenario %s', uniqid('', true)))
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
