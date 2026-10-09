<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\Move;
use App\Entity\User;
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

    public function testCreateReadAndSearchBlockstringBlocks(): void
    {
        $created = $this->createBlockstring($this->graphPayload());

        $this->assertSame('Burnout pressure', $created['title']);
        $this->assertSame('5MP', $created['startingMove']['numpadNotation']);
        $this->assertSame('pending_review', $created['moderationState']);
        $this->assertArrayNotHasKey('classification', $created);
        [$baseline, $adaptation] = $created['blocks'];
        $this->assertSame('Do this by default while they are blocking.', $baseline['description']);
        $this->assertCount(4, $baseline['nodes']);
        $this->assertCount(5, $baseline['edges']);
        $this->assertSame(1, $baseline['nodes'][0]['frameAdvantage']);
        $this->assertNull($baseline['nodes'][1]['frameAdvantage']);
        $this->assertCount(2, $adaptation['nodes']);
        $this->assertSame([$adaptation['nodes'][0]['id']], array_unique(array_column($adaptation['edges'], 'from')));

        $edgesByKind = [];
        foreach ($baseline['edges'] as $edge) {
            $edgesByKind[$edge['kind']][] = $edge;
        }
        $this->assertSame('expects mash', $adaptation['edges'][0]['readLabel']);
        $this->assertSame($baseline['nodes'][0]['id'], $edgesByKind['normal'][2]['to'], 'loop back to the start is kept');
        $this->assertSame([true, null], [$edgesByKind['normal'][0]['trueBlockstring'], $edgesByKind['normal'][0]['gapFrames']]);
        $this->assertSame([false, 0], [$edgesByKind['normal'][1]['trueBlockstring'], $edgesByKind['normal'][1]['gapFrames']]);
        $this->assertSame([false, 3], [$edgesByKind['fake'][0]['trueBlockstring'], $edgesByKind['fake'][0]['gapFrames']]);

        foreach (['startingMoveId=' . $this->moves['5MP']->getId(), 'q=BURNOUT', 'attackerCharacterId=' . $this->character->getId()] as $query) {
            $this->client->request('GET', '/api/blockstrings?' . $query, [], [], $this->getHeaders());
            $search = json_decode((string) $this->client->getResponse()->getContent(), true);
            $this->assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
            $this->assertSame([$created['id']], array_column($search, 'id'), $query);
            $this->assertArrayNotHasKey('blocks', $search[0]);
        }

        $this->client->request('GET', '/api/blockstrings?startingMoveId=' . $this->moves['2MK']->getId(), [], [], $this->getHeaders());
        $this->assertSame([], json_decode((string) $this->client->getResponse()->getContent(), true));
    }

    public function testPendingBlockstringIsHiddenFromOtherUsersAndAnonymousVisitors(): void
    {
        $created = $this->createBlockstring($this->graphPayload());
        $this->assertSame('pending_review', $created['moderationState']);

        $otherUser = (new User())
            ->setUsername('blockstring_other_user')
            ->setPassword(self::hashTestPassword())
            ->setRoles([])
            ->setIsActive(true);
        $this->entityManager->persist($otherUser);
        $this->entityManager->flush();
        $this->client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => 'blockstring_other_user',
            'password' => 'testpassword',
        ]));
        $this->assertResponseIsSuccessful();

        $this->client->request('GET', '/api/blockstrings/' . $created['id']);
        $this->assertSame(Response::HTTP_NOT_FOUND, $this->client->getResponse()->getStatusCode());

        $this->client->request('GET', '/api/blockstrings?q=BURNOUT');
        $this->assertSame([], json_decode((string) $this->client->getResponse()->getContent(), true));

        $this->client->getCookieJar()->clear();
        $this->client->request('GET', '/api/blockstrings/' . $created['id']);
        $this->assertSame(Response::HTTP_NOT_FOUND, $this->client->getResponse()->getStatusCode());
        $this->client->request('GET', '/api/blockstrings?q=BURNOUT');
        $this->assertSame([], json_decode((string) $this->client->getResponse()->getContent(), true));
    }

    public function testReadLabelIsDroppedForNonReadEdges(): void
    {
        $payload = $this->graphPayload();
        $payload['blocks'][0]['edges'][0]['readLabel'] = 'should vanish';

        $created = $this->createBlockstring($payload);

        $this->assertNull($created['blocks'][0]['edges'][0]['readLabel']);
    }

    /** @return iterable<string, array{0: callable(array<string, mixed>): array<string, mixed>}> */
    public static function invalidGraphs(): iterable
    {
        yield 'edge to unknown node' => [static function (array $payload): array { $payload['blocks'][0]['edges'][0]['to'] = 'missing'; return $payload; }];
        yield 'edge into another block' => [static function (array $payload): array { $payload['blocks'][1]['edges'][0]['to'] = 'a'; return $payload; }];
        yield 'unknown edge kind' => [static function (array $payload): array { $payload['blocks'][0]['edges'][0]['kind'] = 'tight'; return $payload; }];
        yield 'true blockstring with gap frames' => [static function (array $payload): array { $payload['blocks'][0]['edges'][0]['gapFrames'] = 0; return $payload; }];
        yield 'negative gap' => [static function (array $payload): array { $payload['blocks'][0]['edges'][1]['gapFrames'] = -1; return $payload; }];
        yield 'non-numeric frame advantage' => [static function (array $payload): array { $payload['blocks'][0]['nodes'][0]['frameAdvantage'] = 'plus'; return $payload; }];
        yield 'missing starting move' => [static function (array $payload): array { unset($payload['startingMoveId']); return $payload; }];
        yield 'no blocks' => [static function (array $payload): array { $payload['blocks'] = []; return $payload; }];
        yield 'empty block' => [static function (array $payload): array { $payload['blocks'][1]['nodes'] = []; $payload['blocks'][1]['edges'] = []; return $payload; }];
        yield 'duplicate node id across blocks' => [static function (array $payload): array { $payload['blocks'][1]['nodes'][1]['clientId'] = 'a'; return $payload; }];
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

    public function testMovesMustBelongToTheAttacker(): void
    {
        $other = (new Character())->setName('Ryu');
        $foreign = (new Move())->setCharacter($other)->setNumpadNotation('2LP');
        $this->entityManager->persist($other);
        $this->entityManager->persist($foreign);
        $this->entityManager->flush();

        foreach (['node' => fn (array $payload): array => array_replace_recursive($payload, ['blocks' => [['nodes' => [['moveId' => (string) $foreign->getId()]]]]]), 'starting move' => fn (array $payload): array => ['startingMoveId' => (string) $foreign->getId()] + $payload] as $case => $mutate) {
            $this->client->request('POST', '/api/blockstrings', [], [], $this->getHeaders(), json_encode($mutate($this->graphPayload()), JSON_THROW_ON_ERROR));
            $this->assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode(), $case);
        }
    }

    public function testModeratorUpdateReplacesTheBlocks(): void
    {
        $created = $this->createBlockstring($this->graphPayload());
        $this->loginTestUserWithRoles([UserRole::MODERATOR->value]);
        $this->addContentTypeJsonToHeaders();
        $payload = $this->graphPayload();
        $payload['blocks'] = [[
            'description' => null,
            'nodes' => [['clientId' => 'x', 'moveId' => (string) $this->moves['2MK']->getId(), 'frameAdvantage' => '-2']],
            'edges' => [['from' => 'x', 'to' => 'x', 'kind' => 'normal']],
        ]];

        $this->client->request('PATCH', '/api/blockstrings/' . $created['id'], [], [], $this->getHeaders(), json_encode($payload, JSON_THROW_ON_ERROR));
        $updated = json_decode((string) $this->client->getResponse()->getContent(), true);

        $this->assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $this->assertCount(1, $updated['blocks']);
        [$block] = $updated['blocks'];
        $this->assertNull($block['description']);
        $this->assertSame(-2, $block['nodes'][0]['frameAdvantage']);
        $this->assertSame($block['edges'][0]['from'], $block['edges'][0]['to']);
    }

    /**
     * Block 1: 5MP -> 5LP -> 2MK loops back to 5MP, 5LP confirms into 236HK and 2MK -> 236HK is a fake 3f gap.
     * Block 2: if they mash, 5LP reads it with 6HP.
     *
     * @return array<string, mixed>
     */
    private function graphPayload(): array
    {
        $id = fn (string $notation): string => (string) $this->moves[$notation]->getId();

        return [
            'title' => 'Burnout pressure',
            'attackerCharacterId' => (string) $this->character->getId(),
            'startingMoveId' => $id('5MP'),
            'blocks' => [
                [
                    'description' => 'Do this by default while they are blocking.',
                    'nodes' => [
                        ['clientId' => 'a', 'moveId' => $id('5MP'), 'frameAdvantage' => '+1'],
                        ['clientId' => 'b', 'moveId' => $id('5LP')],
                        ['clientId' => 'c', 'moveId' => $id('2MK')],
                        ['clientId' => 'd', 'moveId' => $id('236HK')],
                    ],
                    'edges' => [
                        ['from' => 'a', 'to' => 'b', 'kind' => 'normal', 'trueBlockstring' => true],
                        ['from' => 'b', 'to' => 'c', 'kind' => 'normal', 'gapFrames' => 0],
                        ['from' => 'c', 'to' => 'a', 'kind' => 'normal'],
                        ['from' => 'b', 'to' => 'd', 'kind' => 'confirm'],
                        ['from' => 'c', 'to' => 'd', 'kind' => 'fake', 'gapFrames' => '3'],
                    ],
                ],
                [
                    'description' => 'If they start mashing on the gap...',
                    'nodes' => [
                        ['clientId' => 'b2', 'moveId' => $id('5LP')],
                        ['clientId' => 'e', 'moveId' => $id('6HP')],
                    ],
                    'edges' => [
                        ['from' => 'b2', 'to' => 'e', 'kind' => 'read', 'readLabel' => '  expects mash '],
                    ],
                ],
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
