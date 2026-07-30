<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\FrameData;
use App\Entity\Move;
use App\Tests\Controller\AuthenticatedWebTestCase;
use Symfony\Component\HttpFoundation\Response;

final class OkiControllerTest extends AuthenticatedWebTestCase
{
    public function setUp(): void
    {
        parent::setUp();
        $this->client->catchExceptions(false);
    }

    public function testCreateReadAndSearchOkiProfile(): void
    {
        $character = $this->createCharacter('Ken');
        $ender = $this->createMove($character, 'Medium Tatsu', 42);
        $dash = $this->createMove($character, 'Dash');
        $jab = $this->createMove($character, 'LP');
        $throw = $this->createMove($character, 'Throw');
        $dp = $this->createMove($character, 'OD DP');
        $this->entityManager->flush();

        $payload = [
            'moveId' => (string) $ender->getId(),
            'setups' => [[
                'usesDriveRush' => false,
                'autoTimed' => true,
                'cornerOnly' => false,
                'worksNoBackroll' => true,
                'worksBackroll' => true,
                'fakeNoBackroll' => false,
                'fakeBackroll' => true,
                'nodes' => [[
                    'clientId' => 'dash',
                    'moveId' => (string) $dash->getId(),
                    'isDefaultRoute' => true,
                ], [
                    'clientId' => 'jab',
                    'moveId' => (string) $jab->getId(),
                    'isDefaultRoute' => true,
                ], [
                    'clientId' => 'throw',
                    'moveId' => (string) $throw->getId(),
                    'isDefaultRoute' => true,
                    'routeExplanation' => 'Use when they block.',
                    'optionType' => 'MEATY_THROW',
                    'properties' => ['REVERSAL_BAIT'],
                    'interactions' => [[
                        'defensiveMoveId' => (string) $dp->getId(),
                        'result' => 'LOSES',
                        'characterId' => null,
                    ]],
                ]],
                'links' => [[
                    'fromClientId' => 'dash',
                    'toClientId' => 'jab',
                    'stepType' => 'IMMEDIATE',
                ], [
                    'fromClientId' => 'jab',
                    'toClientId' => 'throw',
                    'stepType' => 'WALK_FORWARD',
                    'minFrames' => 7,
                    'maxFrames' => 7,
                ]],
            ]],
        ];

        $this->jsonRequest('POST', '/api/okis', $payload);
        $response = $this->client->getResponse();
        $created = json_decode((string) $response->getContent(), true);

        $this->assertSame(Response::HTTP_CREATED, $response->getStatusCode(), (string) $response->getContent());
        $this->assertSame('Medium Tatsu', $created['move']['numpadNotation']);
        $this->assertSame(42, $created['frameAdvantage']);
        $this->assertTrue($created['summary']['meterless']);
        $this->assertTrue($created['summary']['hasFakeSetups']);
        $this->assertSame('MEATY_THROW', $created['setups'][0]['nodes'][2]['optionType']);
        $this->assertSame('WALK_FORWARD', $created['setups'][0]['links'][1]['stepType']);

        $this->client->request('GET', '/api/okis?optionType=MEATY_THROW&property=REVERSAL_BAIT&hasFakeSetups=true', [], [], $this->getHeaders());
        $search = json_decode((string) $this->client->getResponse()->getContent(), true);

        $this->assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $this->assertCount(1, $search);
        $this->assertSame($created['id'], $search[0]['id']);

        $this->client->request('GET', sprintf('/api/okis/%d', $created['id']), [], [], $this->getHeaders());
        $detail = json_decode((string) $this->client->getResponse()->getContent(), true);

        $this->assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $this->assertCount(3, $detail['setups'][0]['nodes']);
        $this->assertSame('OD DP', $detail['setups'][0]['nodes'][2]['interactions'][0]['defensiveMove']['numpadNotation']);
    }

    public function testUpdateProfileReplacesSetupTree(): void
    {
        $character = $this->createCharacter('Ryu');
        $ender = $this->createMove($character, 'Sweep', 20);
        $dash = $this->createMove($character, 'Dash');
        $meaty = $this->createMove($character, '2MP');
        $this->entityManager->flush();

        $this->jsonRequest('POST', '/api/okis', [
            'moveId' => (string) $ender->getId(),
            'setups' => [],
        ]);
        $this->setMoveOnHit($ender, 21);
        $created = json_decode((string) $this->client->getResponse()->getContent(), true);

        $this->jsonRequest('PATCH', sprintf('/api/okis/%d', $created['id']), [
            'moveId' => (string) $ender->getId(),
            'setups' => [[
                'usesDriveRush' => true,
                'autoTimed' => false,
                'cornerOnly' => true,
                'worksNoBackroll' => true,
                'worksBackroll' => false,
                'fakeNoBackroll' => false,
                'fakeBackroll' => false,
                'nodes' => [[
                    'clientId' => 'dash',
                    'moveId' => (string) $dash->getId(),
                ], [
                    'clientId' => 'meaty',
                    'moveId' => (string) $meaty->getId(),
                    'optionType' => 'MEATY_STRIKE',
                    'properties' => ['LOW'],
                ]],
                'links' => [[
                    'fromClientId' => 'dash',
                    'toClientId' => 'meaty',
                    'stepType' => 'WAIT',
                    'minFrames' => 2,
                    'maxFrames' => 3,
                ]],
            ]],
        ]);
        $updated = json_decode((string) $this->client->getResponse()->getContent(), true);

        $this->assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $this->assertSame(21, $updated['frameAdvantage']);
        $this->assertTrue($updated['summary']['driveRush']);
        $this->assertTrue($updated['summary']['cornerOnly']);
        $this->assertSame('WAIT', $updated['setups'][0]['links'][0]['stepType']);
        $this->assertSame(['LOW'], $updated['setups'][0]['nodes'][1]['properties']);
    }

    public function testCreateAndUpdateReversal(): void
    {
        $character = $this->createCharacter('Akuma');
        $reversalMove = $this->createMove($character, 'OD Shoryuken');
        $this->entityManager->flush();

        $this->jsonRequest('POST', '/api/okis/reversals', [
            'characterId' => (string) $character->getId(),
            'moveId' => (string) $reversalMove->getId(),
            'startup' => 6,
            'reversalType' => 'OD_REVERSAL',
            'properties' => ['STRIKE_INVULNERABLE', 'AIR_INVULNERABLE'],
        ]);
        $created = json_decode((string) $this->client->getResponse()->getContent(), true);

        $this->assertSame(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $this->assertSame('Akuma', $created['character']['name']);
        $this->assertSame(6, $created['startup']);

        $this->jsonRequest('PATCH', sprintf('/api/okis/reversals/%d', $created['id']), [
            'characterId' => (string) $character->getId(),
            'moveId' => (string) $reversalMove->getId(),
            'startup' => 7,
            'reversalType' => 'OD_REVERSAL',
            'properties' => ['STRIKE_INVULNERABLE'],
        ]);
        $updated = json_decode((string) $this->client->getResponse()->getContent(), true);

        $this->assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $this->assertSame(7, $updated['startup']);
        $this->assertSame(['STRIKE_INVULNERABLE'], $updated['properties']);
    }

    private function createCharacter(string $name): Character
    {
        $character = new Character();
        $character->setName($name);
        $this->entityManager->persist($character);

        return $character;
    }

    private function createMove(Character $character, string $notation, ?int $onHit = null): Move
    {
        $move = new Move();
        $move->setCharacter($character);
        $move->setNumpadNotation($notation);
        if (null !== $onHit) {
            $frameData = new FrameData();
            $frameData->setOnHit($onHit);
            $frameData->setMove($move);
            $move->setFrameData($frameData);
            $this->entityManager->persist($frameData);
        }
        $this->entityManager->persist($move);

        return $move;
    }

    private function setMoveOnHit(Move $move, int $onHit): void
    {
        $frameData = $move->getFrameData();
        if (!$frameData instanceof FrameData) {
            $frameData = new FrameData();
            $frameData->setMove($move);
            $move->setFrameData($frameData);
            $this->entityManager->persist($frameData);
        }
        $frameData->setOnHit($onHit);
        $this->entityManager->flush();
    }

    /** @param array<string, mixed> $payload */
    private function jsonRequest(string $method, string $uri, array $payload): void
    {
        $this->client->request(
            $method,
            $uri,
            [],
            [],
            array_merge($this->getHeaders(), ['CONTENT_TYPE' => 'application/json']),
            json_encode($payload, JSON_THROW_ON_ERROR)
        );
    }
}
