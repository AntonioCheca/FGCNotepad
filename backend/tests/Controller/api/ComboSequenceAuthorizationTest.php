<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\ComboSequences;
use App\Entity\ComboSequenceType;
use App\Entity\User;
use App\Entity\Visibility;
use App\Tests\DatabaseTestCase;
use App\Util\Enum\UserRole;
use Symfony\Component\HttpFoundation\Response;

class ComboSequenceAuthorizationTest extends DatabaseTestCase
{
    public function testCreateComboRequiresAuthentication(): void
    {
        $this->seedComboMeta();

        $this->client->request(
            'POST',
            '/api/combo-sequences',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'name' => 'Auth Required Combo',
                'description' => 'desc',
                'type' => 'combo',
            ])
        );

        self::assertSame(Response::HTTP_UNAUTHORIZED, $this->client->getResponse()->getStatusCode());
    }

    public function testNonOwnerUserCannotUpdateCombo(): void
    {
        $this->seedComboMeta();
        $owner = $this->createUser('owner_user', [UserRole::USER]);
        $nonOwner = $this->createUser('other_user', [UserRole::USER]);
        $combo = $this->createCombo($owner);

        $headers = $this->loginHeaders($nonOwner->getUsername(), 'testpassword');
        $this->client->request(
            'PATCH',
            sprintf('/api/combo-sequences/%d', $combo->getId()),
            [],
            [],
            $headers,
            json_encode(['name' => 'Updated'])
        );

        self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());
    }

    public function testOwnerCanUpdateCombo(): void
    {
        $this->seedComboMeta();
        $owner = $this->createUser('owner_user', [UserRole::USER]);
        $combo = $this->createCombo($owner);

        $headers = $this->loginHeaders($owner->getUsername(), 'testpassword');
        $this->client->request(
            'PATCH',
            sprintf('/api/combo-sequences/%d', $combo->getId()),
            [],
            [],
            $headers,
            json_encode(['name' => 'Updated'])
        );

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
    }

    public function testModeratorCanDeleteOthersCombo(): void
    {
        $this->seedComboMeta();
        $owner = $this->createUser('owner_user', [UserRole::USER]);
        $moderator = $this->createUser('mod_user', [UserRole::MODERATOR]);
        $combo = $this->createCombo($owner);

        $headers = $this->loginHeaders($moderator->getUsername(), 'testpassword');
        $this->client->request(
            'DELETE',
            sprintf('/api/combo-sequences/%d', $combo->getId()),
            [],
            [],
            $headers
        );

        self::assertSame(Response::HTTP_NO_CONTENT, $this->client->getResponse()->getStatusCode());
    }

    public function testOwnerCannotSetComboEssentialFlag(): void
    {
        $this->seedComboMeta();
        $owner = $this->createUser('owner_user', [UserRole::USER]);
        $combo = $this->createCombo($owner);

        $headers = $this->loginHeaders($owner->getUsername(), 'testpassword');
        $this->client->request(
            'PATCH',
            sprintf('/api/combo-sequences/%d', $combo->getId()),
            [],
            [],
            $headers,
            json_encode(['isEssential' => true])
        );

        self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());
    }

    public function testModeratorCanSetComboEssentialFlag(): void
    {
        $this->seedComboMeta();
        $owner = $this->createUser('owner_user', [UserRole::USER]);
        $moderator = $this->createUser('mod_user', [UserRole::MODERATOR]);
        $combo = $this->createCombo($owner);

        $headers = $this->loginHeaders($moderator->getUsername(), 'testpassword');
        $this->client->request(
            'PATCH',
            sprintf('/api/combo-sequences/%d', $combo->getId()),
            [],
            [],
            $headers,
            json_encode(['isEssential' => true])
        );

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $this->entityManager->refresh($combo);
        self::assertTrue($combo->isEssential());
    }

    public function testPendingComboIsHiddenFromOtherRegularUsersUntilApproved(): void
    {
        $this->seedComboMeta();
        $owner = $this->createUser('owner_user', [UserRole::USER]);
        $viewer = $this->createUser('viewer_user', [UserRole::USER]);
        $moderator = $this->createUser('mod_user', [UserRole::MODERATOR]);
        $combo = $this->createCombo($owner);
        $combo->setModerationState('pending_review');
        $this->entityManager->flush();

        $viewerHeaders = $this->loginHeaders($viewer->getUsername(), 'testpassword');
        $this->client->request('GET', sprintf('/api/combo-sequences/%d', $combo->getId()), [], [], $viewerHeaders);
        self::assertSame(Response::HTTP_NOT_FOUND, $this->client->getResponse()->getStatusCode());

        $moderatorHeaders = $this->loginHeaders($moderator->getUsername(), 'testpassword');
        $this->client->request(
            'PATCH',
            sprintf('/api/combo-sequences/%d/moderation', $combo->getId()),
            [],
            [],
            $moderatorHeaders,
            json_encode(['state' => 'approved'])
        );
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        $this->client->request('GET', sprintf('/api/combo-sequences/%d', $combo->getId()), [], [], $viewerHeaders);
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
    }

    public function testModeratorCanTransitionComboHiddenBackToApproved(): void
    {
        $this->seedComboMeta();
        $owner = $this->createUser('owner_user', [UserRole::USER]);
        $moderator = $this->createUser('mod_user', [UserRole::MODERATOR]);
        $combo = $this->createCombo($owner);

        $headers = $this->loginHeaders($moderator->getUsername(), 'testpassword');
        $endpoint = sprintf('/api/combo-sequences/%d/moderation', $combo->getId());

        $this->client->request('PATCH', $endpoint, [], [], $headers, json_encode(['state' => 'hidden', 'reason' => 'invalid']));
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        $this->client->request('PATCH', $endpoint, [], [], $headers, json_encode(['state' => 'approved']));
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        $this->entityManager->refresh($combo);
        self::assertSame('approved', $combo->getModerationState());
    }

    /**
     * @param list<UserRole> $roles
     */
    private function createUser(string $username, array $roles): User
    {
        $user = new User();
        $user->setUsername($username);
        $user->setPassword(self::hashTestPassword());
        $user->setRoles(array_map(static fn (UserRole $role): string => $role->value, $roles));

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    private function createCombo(User $author): ComboSequences
    {
        $type = $this->entityManager->getRepository(ComboSequenceType::class)->findOneBy(['name' => 'combo']);
        $visibility = $this->entityManager->getRepository(Visibility::class)->findOneBy(['name' => 'public']);

        if (!$type instanceof ComboSequenceType || !$visibility instanceof Visibility) {
            throw new \RuntimeException('Combo metadata missing in test setup.');
        }

        $combo = (new ComboSequences())
            ->setName('Owned Combo')
            ->setDescription('desc')
            ->setType($type)
            ->setVisibility($visibility)
            ->setAuthor($author);

        $this->entityManager->persist($combo);
        $this->entityManager->flush();

        return $combo;
    }

    private function seedComboMeta(): void
    {
        $type = new ComboSequenceType();
        $type->setName('combo');
        $this->entityManager->persist($type);

        $visibility = new Visibility();
        $visibility->setName('public');
        $this->entityManager->persist($visibility);

        $this->entityManager->flush();
    }

    /**
     * @return array<string, string>
     */
    private function loginHeaders(string $username, string $password): array
    {
        $this->client->restart();
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
