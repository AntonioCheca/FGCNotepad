<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\Move;
use App\Tests\Controller\AuthenticatedWebTestCase;
use App\Util\Enum\UserRole;
use Symfony\Component\HttpFoundation\Response;

class MoveControllerTest extends AuthenticatedWebTestCase
{
    public function testCreateMoveIsForbiddenForRegularUsers(): void
    {
        $characterForMove = $this->addCharacterInBackend();

        $this->client->request('POST', '/api/moves', [], [], $this->getHeaders(), json_encode([
            'numpadNotation' => '236P',
            'characterId' => $characterForMove->getId(),
        ]));

        $this->assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());
    }

    public function testCreateMoveRejectsUnknownCharacter(): void
    {
        $this->loginTestUserWithRoles([UserRole::MODERATOR->value]);

        $this->client->request('POST', '/api/moves', [], [], $this->getHeaders(), json_encode([
            'numpadNotation' => '236P',
            'characterId' => 'missing-character',
        ]));

        $this->assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());
    }

    public function testCreateMove(): void
    {
        $this->loginTestUserWithRoles([UserRole::MODERATOR->value]);
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

    public function testSearchMovesCanFilterByCharacter(): void
    {
        $ryu = $this->addCharacterInBackend('Ryu');
        $ken = $this->addCharacterInBackend('Ken');
        $this->addMoveInBackend($ryu, 'Dash');
        $this->addMoveInBackend($ken, 'Dash');

        $this->client->request(
            'GET',
            sprintf('/api/moves/search?query=Dash&characterId=%s', urlencode((string) $ryu->getId())),
            [],
            [],
            $this->getHeaders(),
        );

        $response = $this->client->getResponse();
        $payload = json_decode((string) $response->getContent(), true);

        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());
        $this->assertIsArray($payload);
        $this->assertCount(1, $payload);
        $this->assertSame((string) $ryu->getId(), $payload[0]['character']['id']);
        $this->assertSame('Ryu Dash', $payload[0]['summary']);
        $this->assertSame('Dash', $payload[0]['numpadNotation']);
        $this->assertArrayHasKey('moveName', $payload[0]);
    }

    private function addCharacterInBackend(string $name = 'Test Character'): Character
    {
        $character = new Character();
        $character->setName($name);

        $entityManager = self::$kernel->getContainer()->get('doctrine')->getManager();
        $entityManager->persist($character);
        $entityManager->flush();

        return $character;
    }

    private function addMoveInBackend(Character $character, string $notation): Move
    {
        $move = new Move();
        $move->setCharacter($character);
        $move->setNumpadNotation($notation);

        $entityManager = self::$kernel->getContainer()->get('doctrine')->getManager();
        $entityManager->persist($move);
        $entityManager->flush();

        return $move;
    }
}
