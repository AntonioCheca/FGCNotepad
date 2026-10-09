<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Tests\DatabaseTestCase;
use Symfony\Component\HttpFoundation\Response;

final class AnonymousApiAccessTest extends DatabaseTestCase
{
    public function testPublicReadEndpointsAnswerAnonymousVisitors(): void
    {
        foreach ([
            '/api/characters',
            '/api/combo-spacings',
            '/api/connection-types',
            '/api/situations',
            '/api/situations/types',
            '/api/moves/search?query=5',
            '/api/combo-sequences?page=1&size=10',
            '/api/combo-sequences/requirements/objects',
            '/api/combo-sequences/leafs/list',
            '/api/okis',
            '/api/okis/enders',
            '/api/blockstrings',
            '/api/scenarios',
        ] as $uri) {
            $this->client->request('GET', $uri);
            self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), $uri);
        }
    }

    public function testWritesSolvingAndPrivateReadsStayBehindLogin(): void
    {
        foreach ([
            ['GET', '/api/moves'],
            ['GET', '/api/profile/me'],
            ['GET', '/api/moderation/queue'],
            ['POST', '/api/combo-sequences'],
            ['POST', '/api/combo-sequences/full'],
            ['POST', '/api/combo-sequences/estimate-damage'],
            ['POST', '/api/okis'],
            ['POST', '/api/blockstrings'],
            ['POST', '/api/scenarios'],
            ['POST', '/api/scenarios/resolve-dynamic-cell'],
            ['POST', '/api/solve_game'],
            ['PATCH', '/api/combo-sequences/1'],
            ['DELETE', '/api/blockstrings/1'],
        ] as [$method, $uri]) {
            $this->client->request($method, $uri, [], [], ['CONTENT_TYPE' => 'application/json'], '{}');
            self::assertSame(Response::HTTP_UNAUTHORIZED, $this->client->getResponse()->getStatusCode(), sprintf('%s %s', $method, $uri));
        }
    }
}
