<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\Move;
use App\Entity\Scenario;
use App\Entity\User;
use App\Tests\DatabaseTestCase;
use App\Util\Enum\UserRole;
use Symfony\Component\HttpFoundation\Response;

class ScenarioAuthorizationTest extends DatabaseTestCase
{
    public function testCreateScenarioRequiresAuthentication(): void
    {
        [$defender, $attacker, $triggerMove] = $this->createScenarioActors();

        $this->client->request(
            'POST',
            '/api/scenarios',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'name' => 'Auth Required Scenario',
                'scenarioType' => 'oki',
                'defenderCharacterId' => $defender->getId()?->toRfc4122(),
                'attackerCharacterId' => $attacker->getId()?->toRfc4122(),
                'triggerMoveId' => $triggerMove->getId()?->toRfc4122(),
                'matrix' => $this->buildMatrixPayload(),
            ])
        );

        self::assertSame(Response::HTTP_UNAUTHORIZED, $this->client->getResponse()->getStatusCode());
    }

    public function testNonOwnerUserCannotUpdateScenario(): void
    {
        $owner = $this->createUser('owner_user', [UserRole::USER]);
        $nonOwner = $this->createUser('other_user', [UserRole::USER]);
        $scenario = $this->createScenario($owner);

        $headers = $this->loginHeaders($nonOwner->getUsername(), 'testpassword');
        $this->client->request(
            'PATCH',
            sprintf('/api/scenarios/%s', $scenario->getPublicId()->toRfc4122()),
            [],
            [],
            $headers,
            json_encode(['name' => 'Updated'])
        );

        self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());
    }

    public function testOwnerCanUpdateScenario(): void
    {
        $owner = $this->createUser('owner_user', [UserRole::USER]);
        $scenario = $this->createScenario($owner);

        $headers = $this->loginHeaders($owner->getUsername(), 'testpassword');
        $this->client->request(
            'PATCH',
            sprintf('/api/scenarios/%s', $scenario->getPublicId()->toRfc4122()),
            [],
            [],
            $headers,
            json_encode(['name' => 'Updated'])
        );

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
    }

    public function testModeratorCanDeleteOthersScenario(): void
    {
        $owner = $this->createUser('owner_user', [UserRole::USER]);
        $moderator = $this->createUser('mod_user', [UserRole::MODERATOR]);
        $scenario = $this->createScenario($owner);

        $headers = $this->loginHeaders($moderator->getUsername(), 'testpassword');
        $this->client->request(
            'DELETE',
            sprintf('/api/scenarios/%s', $scenario->getPublicId()->toRfc4122()),
            [],
            [],
            $headers
        );

        self::assertSame(Response::HTTP_NO_CONTENT, $this->client->getResponse()->getStatusCode());
    }

    public function testOwnerCannotSetScenarioEssentialFlag(): void
    {
        $owner = $this->createUser('owner_user', [UserRole::USER]);
        $scenario = $this->createScenario($owner);

        $headers = $this->loginHeaders($owner->getUsername(), 'testpassword');
        $this->client->request(
            'PATCH',
            sprintf('/api/scenarios/%s', $scenario->getPublicId()->toRfc4122()),
            [],
            [],
            $headers,
            json_encode(['isEssential' => true])
        );

        self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());
    }

    public function testModeratorCanSetScenarioEssentialFlag(): void
    {
        $owner = $this->createUser('owner_user', [UserRole::USER]);
        $moderator = $this->createUser('mod_user', [UserRole::MODERATOR]);
        $scenario = $this->createScenario($owner);

        $headers = $this->loginHeaders($moderator->getUsername(), 'testpassword');
        $this->client->request(
            'PATCH',
            sprintf('/api/scenarios/%s', $scenario->getPublicId()->toRfc4122()),
            [],
            [],
            $headers,
            json_encode(['isEssential' => true])
        );

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $this->entityManager->refresh($scenario);
        self::assertTrue($scenario->isEssential());
    }

    public function testPendingScenarioIsNotPubliclyVisibleUntilApproved(): void
    {
        $owner = $this->createUser('owner_user', [UserRole::USER]);
        $scenario = $this->createScenario($owner);
        $scenario->setModerationState('pending_review');
        $this->entityManager->flush();

        $this->client->request('GET', sprintf('/api/scenarios/%s', $scenario->getPublicId()->toRfc4122()));
        self::assertSame(Response::HTTP_NOT_FOUND, $this->client->getResponse()->getStatusCode());

        $moderator = $this->createUser('mod_user', [UserRole::MODERATOR]);
        $headers = $this->loginHeaders($moderator->getUsername(), 'testpassword');
        $this->client->request(
            'PATCH',
            sprintf('/api/scenarios/%s/moderation', $scenario->getPublicId()->toRfc4122()),
            [],
            [],
            $headers,
            json_encode(['state' => 'approved'])
        );
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        $this->client->request('GET', sprintf('/api/scenarios/%s', $scenario->getPublicId()->toRfc4122()));
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
    }

    public function testModeratorCanTransitionScenarioHiddenBackToApproved(): void
    {
        $owner = $this->createUser('owner_user', [UserRole::USER]);
        $moderator = $this->createUser('mod_user', [UserRole::MODERATOR]);
        $scenario = $this->createScenario($owner);

        $headers = $this->loginHeaders($moderator->getUsername(), 'testpassword');
        $endpoint = sprintf('/api/scenarios/%s/moderation', $scenario->getPublicId()->toRfc4122());

        $this->client->request('PATCH', $endpoint, [], [], $headers, json_encode(['state' => 'hidden', 'reason' => 'spam']));
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        $this->client->request('PATCH', $endpoint, [], [], $headers, json_encode(['state' => 'approved']));
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        $this->entityManager->refresh($scenario);
        self::assertSame('approved', $scenario->getModerationState());
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

    private function createScenario(User $author): Scenario
    {
        [$defender, $attacker, $triggerMove] = $this->createScenarioActors();

        $scenario = (new Scenario())
            ->setName('Scenario Owned')
            ->setScenarioType('oki')
            ->setDefenderCharacter($defender)
            ->setAttackerCharacter($attacker)
            ->setTriggerMove($triggerMove)
            ->setAuthor($author);

        $this->entityManager->persist($scenario);
        $this->entityManager->flush();

        return $scenario;
    }

    /**
     * @return array{Character, Character, Move}
     */
    private function createScenarioActors(): array
    {
        $defender = (new Character())->setName('Ryu');
        $attacker = (new Character())->setName('Ken');
        $triggerMove = (new Move())->setCharacter($attacker)->setNumpadNotation('2HP');

        $this->entityManager->persist($defender);
        $this->entityManager->persist($attacker);
        $this->entityManager->persist($triggerMove);
        $this->entityManager->flush();

        return [$defender, $attacker, $triggerMove];
    }

    /**
     * @return array<string, mixed>
     */
    private function buildMatrixPayload(): array
    {
        return [
            'kind' => 'matrix-editor',
            'schemaVersion' => 1,
            'axes' => [
                'rows' => ['Base'],
                'columns' => ['Block'],
            ],
            'cells' => [[
                ['cellType' => 'value', 'dataType' => 'number', 'value' => 100],
            ]],
            'summary' => [
                'rowAxis' => [['cellType' => 'summary', 'dataType' => 'number', 'value' => 100]],
                'columnAxis' => [['cellType' => 'summary', 'dataType' => 'number', 'value' => 100]],
                'expectedValue' => ['cellType' => 'summary', 'dataType' => 'number', 'value' => 100],
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    private function loginHeaders(string $username, string $password): array
    {
        $this->client->request(
            'POST',
            '/api/login',
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
            'HTTP_X_CSRF_TOKEN' => (string) ($payload['csrfToken'] ?? ''),
            'CONTENT_TYPE' => 'application/json',
        ];
    }
}
