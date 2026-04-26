<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Post;
use App\Entity\User;
use App\Tests\DatabaseTestCase;
use App\Util\Enum\UserRole;
use Symfony\Component\HttpFoundation\Response;

class PostAuthorizationTest extends DatabaseTestCase
{
    public function testUpdatePostRequiresAuthentication(): void
    {
        $owner = $this->createUser('owner_user', [UserRole::USER]);
        $post = $this->createPost($owner, 'Original title');

        $this->client->request(
            'PUT',
            sprintf('/api/posts/%s', $post->getId()?->toRfc4122()),
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['title' => 'Updated'])
        );

        self::assertSame(Response::HTTP_UNAUTHORIZED, $this->client->getResponse()->getStatusCode());
    }

    public function testNonOwnerUserCannotUpdatePost(): void
    {
        $owner = $this->createUser('owner_user', [UserRole::USER]);
        $nonOwner = $this->createUser('other_user', [UserRole::USER]);
        $post = $this->createPost($owner, 'Original title');

        $headers = $this->loginHeaders($nonOwner->getUsername(), 'testpassword');
        $this->client->request(
            'PUT',
            sprintf('/api/posts/%s', $post->getId()?->toRfc4122()),
            [],
            [],
            $headers,
            json_encode(['title' => 'Updated'])
        );

        self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());
    }

    public function testOwnerCanUpdatePost(): void
    {
        $owner = $this->createUser('owner_user', [UserRole::USER]);
        $post = $this->createPost($owner, 'Original title');

        $headers = $this->loginHeaders($owner->getUsername(), 'testpassword');
        $this->client->request(
            'PUT',
            sprintf('/api/posts/%s', $post->getId()?->toRfc4122()),
            [],
            [],
            $headers,
            json_encode(['title' => 'Updated'])
        );

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
    }

    public function testModeratorCanDeleteOthersPost(): void
    {
        $owner = $this->createUser('owner_user', [UserRole::USER]);
        $moderator = $this->createUser('mod_user', [UserRole::MODERATOR]);
        $post = $this->createPost($owner, 'Original title');

        $headers = $this->loginHeaders($moderator->getUsername(), 'testpassword');
        $this->client->request(
            'DELETE',
            sprintf('/api/posts/%s', $post->getId()?->toRfc4122()),
            [],
            [],
            $headers
        );

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
    }

    public function testPendingPostIsHiddenFromOtherRegularUsersUntilApproved(): void
    {
        $author = $this->createUser('author_user', [UserRole::USER]);
        $viewer = $this->createUser('viewer_user', [UserRole::USER]);
        $moderator = $this->createUser('moderator_user', [UserRole::MODERATOR]);

        $authorHeaders = $this->loginHeaders($author->getUsername(), 'testpassword');
        $this->client->request(
            'POST',
            '/api/posts',
            [],
            [],
            $authorHeaders,
            json_encode([
                'title' => 'Pending Post',
                'body' => json_encode(['content' => 'pending']),
            ])
        );
        self::assertSame(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode());
        $createdPayload = json_decode((string) $this->client->getResponse()->getContent(), true);
        $postId = (string) ($createdPayload['id'] ?? '');

        $viewerHeaders = $this->loginHeaders($viewer->getUsername(), 'testpassword');
        $this->client->request('GET', sprintf('/api/posts/%s', $postId), [], [], $viewerHeaders);
        self::assertSame(Response::HTTP_NOT_FOUND, $this->client->getResponse()->getStatusCode());

        $moderatorHeaders = $this->loginHeaders($moderator->getUsername(), 'testpassword');
        $this->client->request(
            'PATCH',
            sprintf('/api/posts/%s/moderation', $postId),
            [],
            [],
            $moderatorHeaders,
            json_encode([
                'state' => 'approved',
            ])
        );
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        $this->client->request('GET', sprintf('/api/posts/%s', $postId), [], [], $viewerHeaders);
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
    }

    public function testModeratorCanTransitionPostHiddenBackToApproved(): void
    {
        $owner = $this->createUser('owner_user', [UserRole::USER]);
        $moderator = $this->createUser('moderator_user', [UserRole::MODERATOR]);
        $post = $this->createPost($owner, 'Moderation Target');

        $headers = $this->loginHeaders($moderator->getUsername(), 'testpassword');
        $endpoint = sprintf('/api/posts/%s/moderation', $post->getId()?->toRfc4122());

        $this->client->request('PATCH', $endpoint, [], [], $headers, json_encode(['state' => 'hidden', 'reason' => 'spam']));
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        $this->client->request('PATCH', $endpoint, [], [], $headers, json_encode(['state' => 'approved']));
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        $this->entityManager->refresh($post);
        self::assertSame('approved', $post->getModerationState());
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

    private function createPost(User $author, string $title): Post
    {
        $post = new Post();
        $post->setTitle($title);
        $post->setBody(json_encode(['content' => 'content']) ?: '{}');
        $post->setAuthor($author);
        $post->setCreatedAt(new \DateTimeImmutable());
        $post->setLastModified(new \DateTimeImmutable());

        $this->entityManager->persist($post);
        $this->entityManager->flush();

        return $post;
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
