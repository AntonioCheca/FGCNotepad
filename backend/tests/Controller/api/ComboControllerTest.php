<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Tests\Controller\AuthenticatedWebTestCase;
use Symfony\Component\HttpFoundation\Response;

class ComboControllerTest extends AuthenticatedWebTestCase
{
    public function testCreateCombo(): void
    {
        $this->addContentTypeJsonToHeaders();

        $this->client->request('POST', '/api/combos', [], [], $this->getHeaders(), json_encode([
            'numpadNotation' => '5P > 236K',
            'damage' => 200
        ]));

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_CREATED, $response->getStatusCode());
        $this->assertJson($response->getContent());
    }

    public function testListCombos(): void
    {
        $this->client->request('GET', '/api/combos', [], [], $this->getHeaders());
        $response = $this->client->getResponse();

        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());
        $this->assertJson($response->getContent());
    }
}
