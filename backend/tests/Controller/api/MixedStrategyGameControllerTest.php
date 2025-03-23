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

        // Simulating the API request for solving the game
        $client = $this->createAuthenticatedClient();

        $client->request(
            'POST',
            '/api/solve_game',
            [],
            [],
            $this->getHeaders(),
            json_encode($payoffMatrix) // Send the JSON-encoded matrix
        );

        $this->assertResponseStatusCodeSame(200); // Expecting HTTP OK (200)

        // Get the response and validate
        $response = $this->client->getResponse();
        $this->assertJson($response->getContent()); // Ensure the response is JSON

        // Decode the response content
        $data = json_decode($response->getContent(), true);

        // Check that the data contains the expected structure (adjust depending on what your endpoint returns)
        // Assuming it returns an array of Nash equilibria or similar results
        $this->assertArrayHasKey('equilibria', $data);
        $this->assertNotEmpty($data['equilibria']); // Check if there are equilibria returned
    }
}
