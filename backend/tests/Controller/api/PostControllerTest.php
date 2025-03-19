<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\Move;
use App\Entity\Post;
use App\Entity\User;
use App\Tests\Controller\AuthenticatedWebTestCase;
use Symfony\Component\HttpFoundation\Response;

class PostControllerTest extends AuthenticatedWebTestCase
{
    public function testCreatePost(): void
    {
        $client = $this->createAuthenticatedClient();
        $client->request('POST', '/api/posts', [], [], $this->getHeaders(), json_encode([
            'title' => 'Test Post',
            'body' => json_encode(["content" => "This is a test post"])
        ]));

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
        $client->request('POST', '/api/posts', [], [], $this->getHeaders(), json_encode([
            'title' => 'Test Post',
            'body' => $jsonBody
        ]));

        $this->assertResponseStatusCodeSame(201);

        /**
         * @var $response Response
         */
        $response = $this->client->getResponse();
        $content = json_decode($response->getContent(), true);
        $uuid = $content['id'];

        $this->client->request('GET', '/api/posts/' . $uuid, [], [], $this->getHeaders());
        $response = $this->client->getResponse();

        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());
        $this->assertJson($response->getContent());
        $data = json_decode($response->getContent(), true);
        $this->assertEquals($uuid, $data['id']);
        $this->assertEquals($jsonBody, json_decode($data['body'], true));
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
}
