<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\Post;
use App\Entity\User;
use App\Tests\Controller\AuthenticatedWebTestCase;
use Symfony\Component\HttpFoundation\Response;

class MoveControllerTest extends AuthenticatedWebTestCase
{
    public function testCreateMove(): void
    {
        $characterForMove = $this->addCharacterInBackend();

        $this->client->request('POST', '/api/moves', [], [], $this->getHeaders(), json_encode([
            'numpadNotation' => '236P',
            'characterId' => $characterForMove->getId(),
        ]));

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_CREATED, $response->getStatusCode());
        $this->assertJson($response->getContent());
    }

    public function testListMoves(): void
    {
        $this->client->request('GET', '/api/moves', [], [], $this->getHeaders());
        $response = $this->client->getResponse();

        $this->assertJson($response->getContent());
        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode(), $message = $response->getContent());
    }

    private function addCharacterInBackend(): Character
    {
        $character = new Character();
        $character->setName('Test Character');

        $entityManager = self::$kernel->getContainer()->get('doctrine')->getManager();
        $entityManager->persist($character);
        $entityManager->flush();

        return $character;
    }
}
