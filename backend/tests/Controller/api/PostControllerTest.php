<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Post;
use App\Entity\User;
use App\Tests\Controller\AuthenticatedWebTestCase;
use Symfony\Component\HttpFoundation\Response;

class PostControllerTest extends AuthenticatedWebTestCase
{
    public function testCreatePost(): void
    {
        $client = $this->createAuthenticatedClient();
        $client->request('POST', '/api/posts', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'title' => 'Test Post',
            'body' => 'This is a test post'
        ]));

        $this->assertResponseStatusCodeSame(201);
    }

    public function testReadPostWithUuid(): void
    {
        $post = $this->addPostInBackend();

        $this->client->request('GET', '/api/posts/' . $post->getId());
        $response = $this->client->getResponse();

        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());
        $this->assertJson($response->getContent());
        $data = json_decode($response->getContent(), true);
        $this->assertEquals($post->getId(), $data['id']);
    }

    public function testReadPostMarkdownParsed(): void
    {
        $post = $this->addPostInBackend();
        $uuid = $post->getId();
        $this->client->request('GET', "/api/posts/$uuid?markdown_parse=true");
        $response = $this->client->getResponse();

        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());
        $this->assertJson($response->getContent());
        $data = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('body', $data);
        $this->assertStringContainsString('<p>', $data['body']); // Checking for parsed HTML
    }

    private function addPostInBackend(): Post
    {
        $post = new Post();
        $post->setTitle('Test Post');
        $post->setBody('This is a test post.');

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
}
