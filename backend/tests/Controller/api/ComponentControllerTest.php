<?php

namespace App\Tests\Controller\api;

use App\Tests\Controller\AuthenticatedWebTestCase;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class ComponentControllerTest extends AuthenticatedWebTestCase
{
    public function testListComponents(): void
    {
        $this->client->request('GET', '/api/components');
        $response = $this->client->getResponse();

        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());
        $this->assertJson($response->getContent());
    }
}