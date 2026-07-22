<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Controller\api\MixedStrategyGameController;
use App\Tests\Controller\AuthenticatedWebTestCase;
use PHPUnit\Framework\TestCase;

class MixedStrategyGameControllerTest extends AuthenticatedWebTestCase
{
    public function testSolveGame(): void
    {
        $payoffMatrix = ['game' =>
            ['A1' => ['B1' => 1, 'B2' => 0], 'A2' => ['B1' => 0, 'B2' => 2]]
        ];

        $client = $this->createAuthenticatedClient();

        $client->request(
            'POST',
            '/api/solve_game',
            [],
            [],
            $this->getHeaders(),
            json_encode($payoffMatrix)
        );

        $this->assertResponseStatusCodeSame(200);

        $response = $this->client->getResponse();
        $this->assertJson($response->getContent());

        $data = json_decode($response->getContent(), true);

        $this->assertArrayHasKey('equilibria', $data);
        $this->assertNotEmpty($data['equilibria']);
    }
}
