<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\Move;
use App\Tests\Controller\AuthenticatedWebTestCase;
use App\Util\Enum\UserRole;
use Symfony\Component\HttpFoundation\Response;

class BlockstringControllerTest extends AuthenticatedWebTestCase
{
    /** @var array<string, Move> */
    private array $moves = [];
    private Character $character;

    public function setUp(): void
    {
        parent::setUp();
        $this->addContentTypeJsonToHeaders();
        $this->character = (new Character())->setName('Akuma');
        $this->entityManager->persist($this->character);
        foreach (['5MP', '5LP', '2MK', '236HK', '6HP'] as $notation) {
            $move = (new Move())->setCharacter($this->character)->setNumpadNotation($notation);
            $this->entityManager->persist($move);
            $this->moves[$notation] = $move;
        }
        $this->entityManager->flush();
    }

    public function testCreateReadAndSearchBlockstringGraph(): void
    {
        $created = $this->createBlockstring($this->graphPayload());

        $this->assertSame('st.MP pressure', $created['title']);
        $this->assertSame('5MP -> 5LP -> 2MK', $created['notation']);
        $this->assertSame('pending_review', $created['moderationState']);
        $this->assertCount(5, $created['nodes']);
        $this->assertCount(6, $created['edges']);

        $nodeIdsByMove = array_column(array_map(static fn (array $node): array => [$node['move']['numpadNotation'], $node['id']], $created['nodes']), 1, 0);
        $edgesByKind = [];
        foreach ($created['edges'] as $edge) {
            $edgesByKind[$edge['kind']][] = $edge;
        }
        $this->assertSame('expects mash', $edgesByKind['read'][0]['readLabel']);
        $this->assertSame(2, $edgesByKind['read'][0]['layer']);
        $this->assertSame($nodeIdsByMove['6HP'], $edgesByKind['read'][0]['to']);
        $this->assertSame($nodeIdsByMove['5MP'], $edgesByKind['normal'][2]['to'], 'loop back to the start is kept');
        $this->assertSame(3, $edgesByKind['fake'][0]['gapFrames']);
        $this->assertSame(-1, $edgesByKind['fake'][0]['frameAdvantage']);
        $this->assertSame(2400, $created['nodes'][3]['damageDealt']);
        $this->assertSame($edgesByKind['fake'][0]['id'], $created['defenseEntries'][0]['edgeId']);

        $this->client->request('GET', '/api/blockstrings?moveId=' . $this->moves['6HP']->getId(), [], [], $this->getHeaders());
        $search = json_decode((string) $this->client->getResponse()->getContent(), true);
        $this->assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $this->assertSame([$created['id']], array_column($search, 'id'));
        $this->assertSame([['from' => '2MK', 'to' => '236HK', 'gapFrames' => 3, 'frameAdvantage' => -1, 'kind' => 'fake']], $search[0]['gaps']);
        $this->assertArrayNotHasKey('edges', $search[0]);
    }

    public function testReadLabelIsDroppedForNonReadEdges(): void
    {
        $payload = $this->graphPayload();
        $payload['edges'][0]['readLabel'] = 'should vanish';

        $created = $this->createBlockstring($payload);

        $this->assertNull($created['edges'][0]['readLabel']);
    }

    /** @return iterable<string, array{0: callable(array<string, mixed>): array<string, mixed>}> */
    public static function invalidGraphs(): iterable
    {
        yield 'edge to unknown node' => [static function (array $payload): array { $payload['edges'][0]['to'] = 'missing'; return $payload; }];
        yield 'unknown edge kind' => [static function (array $payload): array { $payload['edges'][0]['kind'] = 'tight'; return $payload; }];
        yield 'layer out of range' => [static function (array $payload): array { $payload['nodes'][0]['layer'] = 4; return $payload; }];
        yield 'negative damage' => [static function (array $payload): array { $payload['nodes'][0]['damageDealt'] = -5; return $payload; }];
        yield 'defense entry without edge' => [static function (array $payload): array { $payload['defenseEntries'][0]['edgeClientId'] = 'nope'; return $payload; }];
        yield 'no nodes' => [static function (array $payload): array { $payload['nodes'] = []; $payload['edges'] = []; $payload['defenseEntries'] = []; return $payload; }];
        yield 'duplicate node id' => [static function (array $payload): array { $payload['nodes'][1]['clientId'] = 'a'; return $payload; }];
    }

    /**
     * @dataProvider invalidGraphs
     *
     * @param callable(array<string, mixed>): array<string, mixed> $mutate
     */
    public function testInvalidGraphsAreRejected(callable $mutate): void
    {
        $this->client->request('POST', '/api/blockstrings', [], [], $this->getHeaders(), json_encode($mutate($this->graphPayload()), JSON_THROW_ON_ERROR));

        $this->assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
    }

    public function testNodesMustUseTheAttackersMoves(): void
    {
        $other = (new Character())->setName('Ryu');
        $foreign = (new Move())->setCharacter($other)->setNumpadNotation('2LP');
        $this->entityManager->persist($other);
        $this->entityManager->persist($foreign);
        $this->entityManager->flush();
        $payload = $this->graphPayload();
        $payload['nodes'][0]['moveId'] = (string) $foreign->getId();

        $this->client->request('POST', '/api/blockstrings', [], [], $this->getHeaders(), json_encode($payload, JSON_THROW_ON_ERROR));

        $this->assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());
    }

    public function testModeratorUpdateReplacesTheGraph(): void
    {
        $created = $this->createBlockstring($this->graphPayload());
        $this->loginTestUserWithRoles([UserRole::MODERATOR->value]);
        $this->addContentTypeJsonToHeaders();
        $payload = $this->graphPayload();
        $payload['nodes'] = [['clientId' => 'x', 'moveId' => (string) $this->moves['2MK']->getId()]];
        $payload['edges'] = [['from' => 'x', 'to' => 'x', 'kind' => 'normal']];
        $payload['defenseEntries'] = [];

        $this->client->request('PATCH', '/api/blockstrings/' . $created['id'], [], [], $this->getHeaders(), json_encode($payload, JSON_THROW_ON_ERROR));
        $updated = json_decode((string) $this->client->getResponse()->getContent(), true);

        $this->assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $this->assertCount(1, $updated['nodes']);
        $this->assertCount(1, $updated['edges']);
        $this->assertSame($updated['edges'][0]['from'], $updated['edges'][0]['to']);
        $this->assertSame('2MK', $updated['notation']);
    }

    /**
     * 5MP -> 5LP -> 2MK loops back to 5MP; 5LP confirms into 236HK; a hard read swaps 2MK for 6HP; 2MK is fake.
     *
     * @return array<string, mixed>
     */
    private function graphPayload(): array
    {
        $id = fn (string $notation): string => (string) $this->moves[$notation]->getId();

        return [
            'title' => 'st.MP pressure',
            'attackerCharacterId' => (string) $this->character->getId(),
            'classification' => 'frametrap',
            'nodes' => [
                ['clientId' => 'a', 'moveId' => $id('5MP')],
                ['clientId' => 'b', 'moveId' => $id('5LP')],
                ['clientId' => 'c', 'moveId' => $id('2MK')],
                ['clientId' => 'd', 'moveId' => $id('236HK'), 'damageDealt' => 2400],
                ['clientId' => 'e', 'moveId' => $id('6HP'), 'layer' => 2, 'damageReceived' => 3000],
            ],
            'edges' => [
                ['clientId' => 'ab', 'from' => 'a', 'to' => 'b', 'kind' => 'normal'],
                ['clientId' => 'bc', 'from' => 'b', 'to' => 'c', 'kind' => 'normal'],
                ['clientId' => 'ca', 'from' => 'c', 'to' => 'a', 'kind' => 'normal', 'layer' => 1],
                ['clientId' => 'bd', 'from' => 'b', 'to' => 'd', 'kind' => 'confirm'],
                ['clientId' => 'be', 'from' => 'b', 'to' => 'e', 'kind' => 'read', 'readLabel' => '  expects mash ', 'layer' => 2],
                ['clientId' => 'cfake', 'from' => 'c', 'to' => 'd', 'kind' => 'fake', 'gapFrames' => 3, 'frameAdvantage' => -1],
            ],
            'defenseEntries' => [
                ['edgeClientId' => 'cfake', 'instruction' => 'Mash 4f before 236HK.', 'responseType' => 'button', 'outcome' => 'counter_hit'],
            ],
        ];
    }

    /**
     * @param array<string, mixed> $payload
     *
     * @return array<string, mixed>
     */
    private function createBlockstring(array $payload): array
    {
        $this->client->request('POST', '/api/blockstrings', [], [], $this->getHeaders(), json_encode($payload, JSON_THROW_ON_ERROR));
        $response = $this->client->getResponse();
        $this->assertSame(Response::HTTP_CREATED, $response->getStatusCode(), (string) $response->getContent());

        return json_decode((string) $response->getContent(), true);
    }
}
