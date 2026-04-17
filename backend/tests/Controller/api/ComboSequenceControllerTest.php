<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\ComboSequences;
use App\Entity\ComboSequenceType;
use App\Entity\ConnectionType;
use App\Entity\FrameData;
use App\Entity\Move;
use App\Entity\Visibility;
use App\Tests\Controller\AuthenticatedWebTestCase;
use Symfony\Component\HttpFoundation\Response;

class ComboSequenceControllerTest extends AuthenticatedWebTestCase
{
    public function testListLeafs(): void
    {
        $this->client->request(
            'GET',
            '/api/combo-sequences/leafs/list',
            [],
            [],
            $this->getHeaders(),
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());
    }

    public function testTranslateNotationReturnsSteps(): void
    {
        $character = $this->seedTranslationData();

        $this->client->request(
            'POST',
            '/api/combo-sequences/translate',
            [],
            [],
            $this->getJsonHeaders(),
            json_encode([
                'characterId' => (string) $character->getId(),
                'notation' => '2LP, 2LP XX 236MK',
            ])
        );

        $response = $this->client->getResponse();
        $payload = json_decode((string) $response->getContent(), true);

        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());
        $this->assertIsArray($payload);
        $this->assertCount(3, $payload['steps']);
        $this->assertSame('Initial Move', $payload['steps'][0]['connection_type_name']);
        $this->assertSame('Chain', $payload['steps'][1]['connection_type_name']);
        $this->assertSame('Special', $payload['steps'][2]['connection_type_name']);
        $this->assertSame([], $payload['errors']);
    }

    public function testTranslateNotationReturnsPartialErrorsForInvalidToken(): void
    {
        $character = $this->seedTranslationData();

        $this->client->request(
            'POST',
            '/api/combo-sequences/translate',
            [],
            [],
            $this->getJsonHeaders(),
            json_encode([
                'characterId' => (string) $character->getId(),
                'notation' => '2LP, 0LP, 236MK',
            ])
        );

        $response = $this->client->getResponse();
        $payload = json_decode((string) $response->getContent(), true);

        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());
        $this->assertCount(2, $payload['steps']);
        $this->assertCount(1, $payload['errors']);
        $this->assertSame('0LP', $payload['errors'][0]['token']);
        $this->assertSame('unknown_move', $payload['errors'][0]['code']);
    }

    private function getJsonHeaders(): array
    {
        return array_merge($this->getHeaders(), ['CONTENT_TYPE' => 'application/json']);
    }

    private function seedTranslationData(): Character
    {
        $character = new Character();
        $character->setName('Cammy');
        $this->entityManager->persist($character);

        $leafType = new ComboSequenceType();
        $leafType->setName('leaf');
        $this->entityManager->persist($leafType);

        $visibility = new Visibility();
        $visibility->setName('public');
        $this->entityManager->persist($visibility);

        $this->persistConnectionType('Initial Move');
        $this->persistConnectionType('Chain');
        $this->persistConnectionType('Special');
        $this->persistConnectionType('Target Combo');
        $this->persistConnectionType('Link');

        $this->persistLeafSequence($character, $leafType, $visibility, '2LP', 'normal');
        $this->persistLeafSequence($character, $leafType, $visibility, '236MK', 'special');

        $this->entityManager->flush();

        return $character;
    }

    private function persistConnectionType(string $name): void
    {
        $connectionType = new ConnectionType();
        $connectionType->setName($name);
        $this->entityManager->persist($connectionType);
    }

    private function persistLeafSequence(
        Character $character,
        ComboSequenceType $type,
        Visibility $visibility,
        string $notation,
        string $moveType
    ): void
    {
        $move = new Move();
        $move->setCharacter($character);
        $move->setNumpadNotation($notation);

        $frameData = new FrameData();
        $frameData->setMoveType($moveType);
        $move->setFrameData($frameData);

        $sequence = new ComboSequences();
        $sequence->setName(sprintf('Cammy %s', $notation));
        $sequence->setDescription('leaf');
        $sequence->setMove($move);
        $sequence->setType($type);
        $sequence->setVisibility($visibility);

        $this->entityManager->persist($move);
        $this->entityManager->persist($frameData);
        $this->entityManager->persist($sequence);
    }
}
