<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

final class HealthControllerTest extends WebTestCase
{
    public function testHealthEndpointIsPubliclyAccessible(): void
    {
        $client = static::createClient();

        $client->request('GET', '/api/health');

        self::assertSame(Response::HTTP_OK, $client->getResponse()->getStatusCode());
        self::assertSame(['status' => 'ok'], json_decode((string) $client->getResponse()->getContent(), true));
    }
}
