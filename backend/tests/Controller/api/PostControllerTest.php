<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\Move;
use App\Entity\Post;
use App\Entity\Scenario;
use App\Entity\Tag;
use App\Entity\User;
use App\Repository\UserRepository;
use App\Tests\Controller\AuthenticatedWebTestCase;
use Symfony\Component\HttpFoundation\Response;

class PostControllerTest extends AuthenticatedWebTestCase
{
    public function testCreatePost(): void
    {
        $client = $this->createAuthenticatedClient();
        $client->request('POST', '/api/posts', [], [], $this->getHeaders(), json_encode(['title' => 'Test Post', 'body' => json_encode(["content" => "This is a test post"])]));

        $this->assertResponseStatusCodeSame(201);
    }

    public function testReadPostWithUuid(): void
    {
        $post = $this->addPostInBackend();

        $this->client->request('GET', '/api/posts/' . $post->getId(), [], [], $this->getHeaders());
        $response = $this->client->getResponse();

        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());
        $this->assertJson($response->getContent());
        $data = json_decode($response->getContent(), true);
        $this->assertEquals($post->getId(), $data['id']);
    }

    private function addPostInBackend(?array $body = null): Post
    {
        $post = new Post();
        $post->setTitle('Test Post');
        $post->setBody(json_encode($body ?? ["content" => "This is a test post."]));

        $user = new User();
        $user->setUsername('test_username');
        $user->setRoles(['ROLE_USER']);
        $user->setPassword('test_hashed_password');
        $this->entityManager->persist($user);
        $post->setAuthor($user);

        $post->setCreatedAt(new \DateTimeImmutable());
        $post->setLastModified(new \DateTime());

        $entityManager = self::$kernel->getContainer()->get('doctrine')->getManager();
        $entityManager->persist($post);
        $entityManager->flush();

        return $post;
    }

    public function testCreatePostWithRealisticJson(): void
    {
        $jsonBody = <<< JSON
        {
          "root": {
            "children": [
              {
                "children": [
                  {
                    "detail": 0,
                    "format": 0,
                    "mode": "normal",
                    "style": "",
                    "text": "dkjashdjkahskjhdakjhsdkja d",
                    "type": "text",
                    "version": 1
                  },
                  {
                    "type": "custom_mention",
                    "version": 1,
                    "mentionName": "Aki 5LP",
                    "idForComponent": "1effa04d-dcc6-63b6-9b09-99e145a845f5",
                    "text": "",
                    "detailsText": "Aki 5LP"
                  },
                  {
                    "detail": 0,
                    "format": 0,
                    "mode": "normal",
                    "style": "",
                    "text": "dddddd",
                    "type": "text",
                    "version": 1
                  }
                ],
                "direction": "ltr",
                "format": "",
                "indent": 0,
                "type": "paragraph",
                "version": 1,
                "textFormat": 0,
                "textStyle": ""
              }
            ],
            "direction": "ltr",
            "format": "",
            "indent": 0,
            "type": "root",
            "version": 1
          }
        }
        JSON;

        $client = $this->createAuthenticatedClient();
        $client->request('POST', '/api/posts', [], [], $this->getHeaders(), json_encode(['title' => 'Test Post', 'body' => $jsonBody]));

        $this->assertResponseStatusCodeSame(201);

        $response = $this->client->getResponse();
        $content = json_decode($response->getContent(), true);
        $uuid = $content['id'];

        $this->client->request('GET', '/api/posts/' . $uuid, [], [], $this->getHeaders());
        $response = $this->client->getResponse();

        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());
        $this->assertJson($response->getContent());
        $data = json_decode($response->getContent(), true);
        $this->assertEquals($uuid, $data['id']);
        $this->assertEquals(json_decode($jsonBody, true), json_decode($data['body'], true));
    }

    public function testCreatePostDoesNotPersistScenarioTables(): void
    {
        $matrixPayload = [
            'kind' => 'matrix-editor',
            'schemaVersion' => 1,
            'axes' => [
                'rows' => ['Row A'],
                'columns' => ['Col A'],
            ],
            'cells' => [
                [[
                    'cellType' => 'value',
                    'dataType' => 'number',
                    'value' => 25,
                ]],
            ],
            'summary' => [
                'rowAxis' => [[
                    'cellType' => 'summary',
                    'dataType' => 'number',
                    'value' => 100,
                ]],
                'columnAxis' => [[
                    'cellType' => 'summary',
                    'dataType' => 'number',
                    'value' => 100,
                ]],
                'expectedValue' => [
                    'cellType' => 'summary',
                    'dataType' => 'number',
                    'value' => 25,
                ],
            ],
            'metadata' => [
                'matrixId' => 'mx_post_test',
                'title' => 'Corner Escape Matrix',
            ],
        ];

        $lexicalBody = [
            'root' => [
                'type' => 'root',
                'version' => 1,
                'children' => [[
                    'type' => 'scenario-table',
                    'version' => 1,
                    'matrix' => $matrixPayload,
                ]],
            ],
        ];

        $client = $this->createAuthenticatedClient();
        $client->request(
            'POST',
            '/api/posts',
            [],
            [],
            $this->getHeaders(),
            json_encode([
                'title' => 'Post With Scenario Table',
                'body' => json_encode($lexicalBody),
            ])
        );

        $this->assertResponseStatusCodeSame(Response::HTTP_CREATED);

        $responsePayload = json_decode((string) $this->client->getResponse()->getContent(), true);
        $post = $this->entityManager->getRepository(Post::class)->find($responsePayload['id']);
        $this->assertNotNull($post);

        $savedBody = json_decode($post->getBody(), true);
        $this->assertNull($savedBody['root']['children'][0]['matrix']['extensions']['scenarioId'] ?? null);

        $scenarioCount = $this->entityManager->getRepository(Scenario::class)->count([]);
        $this->assertSame(0, $scenarioCount);
    }

    private function addMoveInBackend(): Move
    {
        $character = new Character();
        $character->setName('Test character');
        $move = new Move();
        $move->setNumpadNotation('5HP');
        $move->setCharacter($character);

        $entityManager = self::$kernel->getContainer()->get('doctrine')->getManager();
        $entityManager->persist($character);
        $entityManager->persist($move);
        $entityManager->flush();

        return $move;
    }

    public function testCreatePostWithTags(): void
    {
        $this->createAuthenticatedClient();
        $this->client->request('POST', '/api/posts', [], [], $this->getHeaders(), json_encode(['title' => 'Test Post with Tags', 'body' => json_encode(['content' => 'This is a test post.']), 'tags' => ['Tag1', 'Tag2']]));

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_CREATED, $response->getStatusCode());
        $this->assertJson($response->getContent());
        $data = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('id', $data);

        // Verify post in DB
        $post = $this->entityManager->getRepository(Post::class)->find($data['id']);
        $this->assertCount(2, $post->getTags());
        $this->assertEquals('Tag1', $post->getTags()[0]->getName());
        $this->assertEquals('Tag2', $post->getTags()[1]->getName());
    }

    public function testReadPostWithTags(): void
    {
        $this->createAuthenticatedClient();
        $post = $this->addPostWithTags(['Tag1', 'Tag2']);

        $this->client->request('GET', '/api/posts/' . $post->getId(), [], [], $this->getHeaders());
        $response = $this->client->getResponse();

        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());
        $this->assertJson($response->getContent());
        $data = json_decode($response->getContent(), true);

        $this->assertEquals($post->getId(), $data['id']);
        $this->assertEquals(['Tag1', 'Tag2'], $data['tags']);
    }

    private function addPostWithTags(array $tagNames): Post
    {
        /** @var TagRepository $tagRepository */
        $tagRepository = $this->entityManager->getRepository(Tag::class);
        /** @var UserRepository $userRepository */
        $userRepository = $this->entityManager->getRepository(User::class);

        $post = new Post();
        $post->setTitle('Test Post');
        $post->setBody(json_encode(["content" => "This is a test post."]));

        $userName = 'test_username';
        $user = $userRepository->findOneBy(['username' => $userName]);
        if (!$user) {
            $user = new User();
            $user->setUsername($userName);
            $user->setRoles(['ROLE_USER']);
            $user->setPassword('test_hashed_password');
            $this->entityManager->persist($user);
        }
        $post->setAuthor($user);

        $post->setCreatedAt(new \DateTimeImmutable());
        $post->setLastModified(new \DateTime());

        foreach ($tagNames as $tagName) {
            // Check if the tag already exists
            $tag = $tagRepository->findOneBy(['name' => $tagName]);

            // If not found, create a new one
            if (!$tag) {
                $tag = new Tag();
                $tag->setName($tagName);
                $this->entityManager->persist($tag);
            }

            $post->addTag($tag);
        }

        $this->entityManager->persist($post);
        $this->entityManager->flush();

        return $post;
    }

    public function testListPostsWithIncludedAndExcludedTags(): void
    {
        $this->createAuthenticatedClient();

        // Create posts with different tag combinations
        $post1 = $this->addPostWithTags(['TagA', 'TagB']); // Should be included
        $post2 = $this->addPostWithTags(['TagB', 'TagC']); // Should be excluded
        $post3 = $this->addPostWithTags(['TagD']);         // Should be excluded
        $post4 = $this->addPostWithTags(['TagC', 'TagD']); // Should be excluded

        // Search for posts with TagB but excluding TagD
        $this->client->request('GET', '/api/posts', ['query' => '', 'includedTags' => 'TagB', // Must include at least TagB and TagC
            'excludedTags' => 'TagC', // Must NOT include TagD
        ], [], $this->getHeaders());

        $response = $this->client->getResponse();

        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());
        $this->assertJson($response->getContent());

        $data = json_decode($response->getContent(), true);
        $returnedPostIds = array_column($data['data'], 'id');

        $this->assertContains($post1->getId()->toString(), $returnedPostIds);
        $this->assertNotContains($post2->getId()->toString(), $returnedPostIds);
        $this->assertNotContains($post3->getId()->toString(), $returnedPostIds);
        $this->assertNotContains($post4->getId()->toString(), $returnedPostIds);
    }

    public function testListPostsWithoutTags(): void
    {
        $this->createAuthenticatedClient();

        // Create posts with different tag combinations
        $post1 = $this->addPostWithTags(['TagA', 'TagB']); // Should be included
        $post2 = $this->addPostWithTags(['TagB', 'TagC']); // Should be excluded
        $post3 = $this->addPostWithTags(['TagD']);         // Should be excluded
        $post4 = $this->addPostWithTags(['TagC', 'TagD']); // Should be excluded

        // Search for posts with TagB but excluding TagD
        $this->client->request('GET', '/api/posts', [], [], $this->getHeaders());

        $response = $this->client->getResponse();

        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());
        $this->assertJson($response->getContent());

        $data = json_decode($response->getContent(), true);
        $returnedPostIds = array_column($data['data'], 'id');

        $this->assertContains($post1->getId()->toString(), $returnedPostIds);
        $this->assertContains($post2->getId()->toString(), $returnedPostIds);
        $this->assertContains($post3->getId()->toString(), $returnedPostIds);
        $this->assertContains($post4->getId()->toString(), $returnedPostIds);
    }
}
