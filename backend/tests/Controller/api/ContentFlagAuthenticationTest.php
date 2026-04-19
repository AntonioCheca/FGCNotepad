<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Tests\DatabaseTestCase;
use Symfony\Component\HttpFoundation\Response;

class ContentFlagAuthenticationTest extends DatabaseTestCase
{
    public function testCreateScenarioFlagRequiresAuthentication(): void
    {
        $this->client->request(
            'POST',
            '/api/flags/scenarios',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'scenarioId' => '00000000-0000-0000-0000-000000000000',
                'comment' => 'Invalid data',
            ])
        );

        self::assertSame(Response::HTTP_UNAUTHORIZED, $this->client->getResponse()->getStatusCode());
    }

    public function testCreateComboFlagRequiresAuthentication(): void
    {
        $this->client->request(
            'POST',
            '/api/flags/combos',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'comboId' => 1,
                'comment' => 'Invalid link',
            ])
        );

        self::assertSame(Response::HTTP_UNAUTHORIZED, $this->client->getResponse()->getStatusCode());
    }
}
