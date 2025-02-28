<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Tests\Controller\AuthenticatedWebTestCase;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

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
}
