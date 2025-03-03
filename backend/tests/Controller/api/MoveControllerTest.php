<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Tests\Controller\AuthenticatedWebTestCase;
use Symfony\Component\HttpFoundation\Response;

class MoveControllerTest extends AuthenticatedWebTestCase
{
    public function testCreateMove(): void
    {
        $this->client->request('POST', '/api/moves', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'numpadNotation' => '236P',
            'startup' => 5
        ]));

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_CREATED, $response->getStatusCode());
        $this->assertJson($response->getContent());
    }

    public function testListMoves(): void
    {
        $this->client->request('GET', '/api/moves');
        $response = $this->client->getResponse();

        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());
        $this->assertJson($response->getContent());
    }
}
