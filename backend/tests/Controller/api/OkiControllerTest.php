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
        $other = $this->createCharacter('Ryu');
        $ender = $this->createMove($character, 'Medium Tatsu');
        $meaty = $this->createMove($character, '2MK');
        $throw = $this->createMove($character, 'LPLK');
        $this->createMove($other, 'Sweep');
        $this->entityManager->flush();

        $this->jsonRequest('POST', '/api/okis', [
            'moveId' => (string) $ender->getId(),
            'setups' => [[
                'name' => '  Corner meaty ',
                'cornerOnly' => true,
                'nodes' => [
                    ['clientId' => 'walk', 'action' => 'WALK_FORWARD'],
                    ['clientId' => 'meaty', 'moveId' => (string) $meaty->getId(), 'hitLevel' => 'LOW', 'sideSwitch' => true],
                    ['clientId' => 'throw', 'moveId' => (string) $throw->getId()],
                    ['clientId' => 'shimmy', 'action' => 'SHIMMY'],
                ],
                'links' => [
                    ['fromClientId' => 'ender', 'toClientId' => 'walk'],
                    ['fromClientId' => 'walk', 'toClientId' => 'meaty'],
                    ['fromClientId' => 'walk', 'toClientId' => 'throw', 'stepType' => 'DELAY', 'kind' => 'read', 'readLabel' => 'expects block'],
                    ['fromClientId' => 'walk', 'toClientId' => 'shimmy', 'kind' => 'confirm'],
                ],
            ]],
        ]);
        $created = json_decode((string) $this->client->getResponse()->getContent(), true);

        $this->assertSame(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $this->assertArrayNotHasKey('frameAdvantage', $created);
        $this->assertSame(1, $created['setupCount']);
        $setup = $created['setups'][0];
        $this->assertSame('Corner meaty', $setup['name']);
        $this->assertTrue($setup['cornerOnly']);
        $this->assertFalse($setup['backrollDependent']);
        [$walkNode, $meatyNode, $throwNode, $shimmyNode] = $setup['nodes'];
        $this->assertSame('WALK_FORWARD', $walkNode['action']);
        $this->assertSame('LOW', $meatyNode['hitLevel']);
        $this->assertTrue($meatyNode['sideSwitch']);
        $this->assertArrayNotHasKey('layer', $throwNode);
        $this->assertNull($shimmyNode['move']);
        $this->assertSame('SHIMMY', $shimmyNode['action']);
        $this->assertSame(
            [[null, $walkNode['id'], 'IMMEDIATE'], [$walkNode['id'], $meatyNode['id'], 'IMMEDIATE'], [$walkNode['id'], $throwNode['id'], 'DELAY'], [$walkNode['id'], $shimmyNode['id'], 'IMMEDIATE']],
            array_map(static fn (array $link): array => [$link['fromNodeId'], $link['toNodeId'], $link['stepType']], $setup['links']),
        );
        $this->assertSame('expects block', $setup['links'][2]['readLabel']);

        $this->client->request('GET', sprintf('/api/okis?characterId=%s', $character->getId()), [], [], $this->getHeaders());
        $byCharacter = json_decode((string) $this->client->getResponse()->getContent(), true);
        $this->assertSame([$created['id']], array_column($byCharacter, 'id'));

        $this->client->request('GET', sprintf('/api/okis?characterId=%s', $other->getId()), [], [], $this->getHeaders());
        $otherCharacter = json_decode((string) $this->client->getResponse()->getContent(), true);
        $this->assertSame([], $otherCharacter);

        $this->client->request('GET', sprintf('/api/okis/%d', $created['id']), [], [], $this->getHeaders());
        $detail = json_decode((string) $this->client->getResponse()->getContent(), true);
        $this->assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $this->assertSame($setup['links'], $detail['setups'][0]['links']);
    }

    public function testUpdateProfileReplacesSetupTree(): void
    {
        $character = $this->createCharacter('Ryu');
        $ender = $this->createMove($character, 'Sweep');
        $jumpIn = $this->createMove($character, '8HK');
        $this->entityManager->flush();

        $this->jsonRequest('POST', '/api/okis', ['moveId' => (string) $ender->getId(), 'setups' => []]);
        $created = json_decode((string) $this->client->getResponse()->getContent(), true);

        $this->jsonRequest('PATCH', sprintf('/api/okis/%d', $created['id']), [
            'moveId' => (string) $ender->getId(),
            'setups' => [[
                'name' => 'Backroll route',
                'backrollDependent' => true,
                'nodes' => [
                    ['clientId' => 'jump', 'action' => 'FORWARD_JUMP'],
                    ['clientId' => 'jumpIn', 'moveId' => (string) $jumpIn->getId(), 'hitLevel' => 'OVERHEAD'],
                ],
                'links' => [
                    ['fromClientId' => 'ender', 'toClientId' => 'jump', 'recovery' => 'RISE_IN_PLACE'],
                    ['fromClientId' => 'jump', 'toClientId' => 'jumpIn', 'safeJump' => true],
                ],
            ]],
        ]);
        $updated = json_decode((string) $this->client->getResponse()->getContent(), true);

        $this->assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $setup = $updated['setups'][0];
        $this->assertSame('Backroll route', $setup['name']);
        $this->assertTrue($setup['backrollDependent']);
        $this->assertSame('FORWARD_JUMP', $setup['nodes'][0]['action']);
        $this->assertSame('OVERHEAD', $setup['nodes'][1]['hitLevel']);
        $this->assertSame(['IMMEDIATE', false, 'RISE_IN_PLACE'], [$setup['links'][0]['stepType'], $setup['links'][0]['safeJump'], $setup['links'][0]['recovery']]);
        $this->assertSame([true, null], [$setup['links'][1]['safeJump'], $setup['links'][1]['recovery']]);
    }

    public function testSecondOkiForTheSameEnderIsRejected(): void
    {
        $character = $this->createCharacter('Akuma');
        $ender = $this->createMove($character, '214MK');
        $this->entityManager->flush();

        $this->jsonRequest('POST', '/api/okis', ['moveId' => (string) $ender->getId(), 'setups' => []]);
        $created = json_decode((string) $this->client->getResponse()->getContent(), true);
        $this->jsonRequest('POST', '/api/okis', ['moveId' => (string) $ender->getId(), 'setups' => []]);
        $conflict = json_decode((string) $this->client->getResponse()->getContent(), true);

        $this->assertSame(Response::HTTP_CONFLICT, $this->client->getResponse()->getStatusCode());
        $this->assertSame($created['id'], $conflict['id']);
    }

    public function testEnderSearchOnlyOffersTheCharactersMovesWithoutAnOki(): void
    {
        $cammy = $this->createCharacter('Cammy');
        $ken = $this->createCharacter('Ken');
        $spiralArrow = $this->createMove($cammy, '236LK');
        $spinKnuckle = $this->createMove($cammy, '236P');
        $hooligan = $this->createMove($cammy, '236MK');
        $this->createMove($ken, '236HK');
        $spinKnuckle->setCommonName('Spin Knuckle');
        $this->entityManager->flush();
        $this->jsonRequest('POST', '/api/okis', ['moveId' => (string) $hooligan->getId(), 'setups' => []]);

        $this->client->request('GET', sprintf('/api/okis/enders?characterId=%s&query=236', $cammy->getId()), [], [], $this->getHeaders());
        $byNotation = json_decode((string) $this->client->getResponse()->getContent(), true);
        $this->client->request('GET', sprintf('/api/okis/enders?characterId=%s&query=knuckle', $cammy->getId()), [], [], $this->getHeaders());
        $byCommonName = json_decode((string) $this->client->getResponse()->getContent(), true);

        $this->assertSame([(string) $spiralArrow->getId(), (string) $spinKnuckle->getId()], array_column($byNotation, 'id'));
        $this->assertSame('Cammy 236LK', $byNotation[0]['summary']);
        $this->assertSame(['Spin Knuckle'], array_column($byCommonName, 'commonName'));
    }

    /** @return iterable<string, array{0: array<string, mixed>, 1: list<array<string, mixed>>, 2?: string}> */
    public static function invalidSetups(): iterable
    {
        $node = ['clientId' => 'a', 'action' => 'BLOCK'];
        yield 'unknown link kind' => [$node, [['fromClientId' => 'ender', 'toClientId' => 'a', 'kind' => 'tight']]];
        yield 'unknown step' => [$node, [['fromClientId' => 'ender', 'toClientId' => 'a', 'stepType' => 'FORWARD_DASH']]];
        yield 'fake arrow' => [$node, [['fromClientId' => 'ender', 'toClientId' => 'a', 'kind' => 'fake']]];
        yield 'unknown action' => [['clientId' => 'a', 'action' => 'TELEPORT'], []];
        yield 'recovery without backroll dependency' => [$node, [['fromClientId' => 'ender', 'toClientId' => 'a', 'recovery' => 'BACKROLL']]];
        yield 'duplicate link' => [$node, [['fromClientId' => 'ender', 'toClientId' => 'a'], ['fromClientId' => 'ender', 'toClientId' => 'a']]];
        yield 'link into the ender' => [$node, [['fromClientId' => 'a', 'toClientId' => 'ender']]];
        yield 'safe jump into a jump action' => [['clientId' => 'a', 'action' => 'FORWARD_JUMP'], [['fromClientId' => 'ender', 'toClientId' => 'a', 'safeJump' => true]]];
        yield 'unnamed setup' => [$node, [], '  '];
        yield 'overlong setup name' => [$node, [], str_repeat('x', 81)];
    }

    /**
     * @dataProvider invalidSetups
     * @param array<string, mixed> $node
     * @param list<array<string, mixed>> $links
     */
    public function testOkiRejectsInvalidSetup(array $node, array $links, string $name = 'Main line'): void
    {
        $character = $this->createCharacter('Ken');
        $ender = $this->createMove($character, 'Heavy Tatsu', 30);
        $this->entityManager->flush();

        $this->jsonRequest('POST', '/api/okis', ['moveId' => (string) $ender->getId(), 'setups' => [['name' => $name, 'nodes' => [$node], 'links' => $links]]]);

        $this->assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());
    }

    public function testOkiNodeNeedsExactlyOneOfMoveOrAction(): void
    {
        $character = $this->createCharacter('Ken');
        $ender = $this->createMove($character, 'Heavy Tatsu', 30);
        $jab = $this->createMove($character, '5LP');
        $this->entityManager->flush();

        foreach ([['clientId' => 'a'], ['clientId' => 'a', 'action' => 'BLOCK', 'moveId' => (string) $jab->getId()]] as $node) {
            $this->jsonRequest('POST', '/api/okis', ['moveId' => (string) $ender->getId(), 'setups' => [['name' => 'Main line', 'nodes' => [$node], 'links' => []]]]);
            $this->assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());
        }
    }

    public function testSafeJumpOnlyStepsIntoJumpingAttacks(): void
    {
        $character = $this->createCharacter('Ken');
        $jab = $this->createMove($character, '5LP');
        $jumpIn = $this->createMove($character, '9HK');

        foreach ([[$jab, Response::HTTP_BAD_REQUEST], [$jumpIn, Response::HTTP_CREATED]] as [$target, $status]) {
            $ender = $this->createMove($character, sprintf('Heavy Tatsu %s', $target->getNumpadNotation()));
            $this->entityManager->flush();
            $this->jsonRequest('POST', '/api/okis', ['moveId' => (string) $ender->getId(), 'setups' => [[
                'name' => 'Safe jump',
                'nodes' => [['clientId' => 'a', 'moveId' => (string) $target->getId()]],
                'links' => [['fromClientId' => 'ender', 'toClientId' => 'a', 'safeJump' => true]],
            ]]]);
            $this->assertSame($status, $this->client->getResponse()->getStatusCode());
        }
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
