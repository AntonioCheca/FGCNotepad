<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\ComboSpacing;
use App\Entity\Move;
use App\Tests\Controller\AuthenticatedWebTestCase;
use Symfony\Component\HttpFoundation\Response;

class BlockstringControllerTest extends AuthenticatedWebTestCase
{
    public function testCreateReadAndSearchBlockstring(): void
    {
        $this->addContentTypeJsonToHeaders();
        $character = (new Character())->setName('Akuma');
        $move = (new Move())->setCharacter($character)->setNumpadNotation('st.MP');
        $jab = (new Move())->setCharacter($character)->setNumpadNotation('LP');
        $kick = (new Move())->setCharacter($character)->setNumpadNotation('5HK');
        $spacing = (new ComboSpacing())->setCode('tip')->setName('Tip')->setDescription('At tip range')->setSortOrder(1);
        $this->entityManager->persist($character);
        $this->entityManager->persist($move);
        $this->entityManager->persist($jab);
        $this->entityManager->persist($kick);
        $this->entityManager->persist($spacing);
        $this->entityManager->flush();

        $payload = [
            'title' => 'Akuma st.MP pressure',
            'summary' => 'Default pressure with a documented gap.',
            'attackerCharacterId' => (string) $character->getId(),
            'classification' => 'fake',
            'steps' => [
                ['moveId' => (string) $move->getId(), 'ordinal' => 1, 'canConfirmOnHit' => true],
                ['moveId' => (string) $jab->getId(), 'ordinal' => 2],
                ['moveId' => (string) $kick->getId(), 'ordinal' => 3],
            ],
            'gaps' => [
                ['clientId' => 'gap-a', 'stepOrdinal' => 2, 'timing' => 'before_step', 'frames' => 0, 'frameAdvantage' => 2],
                ['clientId' => 'gap-b', 'stepOrdinal' => 2, 'timing' => 'during_step', 'frames' => 4, 'classification' => 'safe', 'frameAdvantage' => '-1', 'note' => 'Ignored legacy gap note'],
                ['clientId' => 'gap-c', 'stepOrdinal' => 3, 'timing' => 'before_step', 'frames' => 3],
            ],
            'defenseEntries' => [
                [
                    'gapClientId' => 'gap-c',
                    'instruction' => 'Trade before 5HK.',
                    'responseType' => 'button',
                    'outcome' => 'trade',
                ],
                [
                    'gapClientId' => 'gap-a',
                    'instruction' => 'Interrupt before LP connects.',
                    'responseType' => 'reversal',
                    'outcome' => 'counter_hit',
                    'conversion' => 'Invincible reversal punish',
                ],
            ],
            'adaptations' => [[
                'clientId' => 'adaptation-a',
                'gapClientId' => 'gap-c',
                'explanation' => 'Hard-read mash with cr.MP.',
                'steps' => [
                    ['moveId' => (string) $move->getId(), 'ordinal' => 1],
                ],
                'comboSearch' => [
                    'firstMoveId' => (string) $move->getId(),
                    'spacingCode' => 'tip',
                    'counterHitRequired' => true,
                    'minDamage' => 3500,
                ],
            ]],
        ];

        $this->client->request('POST', '/api/blockstrings', [], [], $this->getHeaders(), json_encode($payload, JSON_THROW_ON_ERROR));
        $response = $this->client->getResponse();
        $created = json_decode((string) $response->getContent(), true);

        $this->assertSame(Response::HTTP_CREATED, $response->getStatusCode(), (string) $response->getContent());
        $this->assertSame('Akuma st.MP pressure', $created['title']);
        $this->assertSame('st.MP -> LP -> 5HK', $created['notation']);
        $this->assertCount(3, $created['gaps']);
        $this->assertSame(2, $created['gaps'][0]['stepOrdinal']);
        $this->assertSame('before_step', $created['gaps'][0]['timing']);
        $this->assertSame(0, $created['gaps'][0]['frames']);
        $this->assertSame('safe', $created['gaps'][0]['classification']);
        $this->assertSame(2, $created['gaps'][0]['frameAdvantage']);
        $this->assertSame('during_step', $created['gaps'][1]['timing']);
        $this->assertSame(4, $created['gaps'][1]['frames']);
        $this->assertSame(0, $created['gaps'][1]['frameAdvantage']);
        $this->assertSame('safe', $created['gaps'][1]['classification']);
        $this->assertArrayNotHasKey('note', $created['gaps'][1]);
        $this->assertSame('trades', $created['gaps'][2]['classification']);
        $this->assertSame(0, $created['gaps'][2]['frameAdvantage']);
        $this->assertSame($created['gaps'][0]['id'], $created['defenseEntries'][0]['gapId']);
        $this->assertSame(2, $created['defenseEntries'][0]['gapStepOrdinal']);
        $this->assertSame('reversal', $created['defenseEntries'][0]['responseType']);
        $this->assertSame($created['gaps'][2]['id'], $created['defenseEntries'][1]['gapId']);
        $this->assertSame(1, $created['gaps'][2]['adaptationCount']);
        $this->assertCount(1, $created['adaptations']);
        $this->assertSame($created['gaps'][2]['id'], $created['adaptations'][0]['gapId']);
        $this->assertSame('Hard-read mash with cr.MP.', $created['adaptations'][0]['explanation']);
        $this->assertSame('st.MP', $created['adaptations'][0]['steps'][0]['move']['numpadNotation']);
        $this->assertTrue($created['adaptations'][0]['comboSearch']['filters']['counterHitRequired']);
        $this->assertSame(['tip'], $created['adaptations'][0]['comboSearch']['filters']['spacingCodes']);
        $this->assertSame('Tip', $created['adaptations'][0]['comboSearch']['spacing']['name']);
        $this->assertStringContainsString('spacingCodes=tip', $created['adaptations'][0]['comboSearch']['url']);
        $this->assertSame(3500, $created['adaptations'][0]['comboSearch']['filters']['minDamage']);
        $this->assertSame('pending_review', $created['moderationState']);

        $this->client->request('GET', '/api/blockstrings?q=akuma', [], [], $this->getHeaders());
        $response = $this->client->getResponse();
        $searchPayload = json_decode((string) $response->getContent(), true);

        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());
        $this->assertCount(1, $searchPayload);
        $this->assertSame($created['id'], $searchPayload[0]['id']);
    }

    public function testDefenseEntryMustTargetGap(): void
    {
        $this->addContentTypeJsonToHeaders();
        $character = (new Character())->setName('Akuma');
        $move = (new Move())->setCharacter($character)->setNumpadNotation('st.MP');
        $jab = (new Move())->setCharacter($character)->setNumpadNotation('LP');
        $this->entityManager->persist($character);
        $this->entityManager->persist($move);
        $this->entityManager->persist($jab);
        $this->entityManager->flush();

        $payload = [
            'title' => 'Invalid defense target',
            'attackerCharacterId' => (string) $character->getId(),
            'classification' => 'fake',
            'steps' => [
                ['moveId' => (string) $move->getId(), 'ordinal' => 1],
                ['moveId' => (string) $jab->getId(), 'ordinal' => 2],
            ],
            'defenseEntries' => [[
                'gapClientId' => 'missing-gap',
                'instruction' => 'This gap does not exist.',
            ]],
        ];

        $this->client->request('POST', '/api/blockstrings', [], [], $this->getHeaders(), json_encode($payload, JSON_THROW_ON_ERROR));

        $this->assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());
    }

    public function testCreateBlockstringWithLayeredRoutesAndHitConfirmConnection(): void
    {
        $this->addContentTypeJsonToHeaders();
        $character = (new Character())->setName('Kimberly');
        $fiveMk = (new Move())->setCharacter($character)->setNumpadNotation('5MK TC');
        $twoLp = (new Move())->setCharacter($character)->setNumpadNotation('2LP');
        $twoMk = (new Move())->setCharacter($character)->setNumpadNotation('2MK');
        $run = (new Move())->setCharacter($character)->setNumpadNotation('214M');
        $this->entityManager->persist($character);
        $this->entityManager->persist($fiveMk);
        $this->entityManager->persist($twoLp);
        $this->entityManager->persist($twoMk);
        $this->entityManager->persist($run);
        $this->entityManager->flush();

        $payload = [
            'title' => 'Layered TC pressure',
            'attackerCharacterId' => (string) $character->getId(),
            'classification' => 'frametrap',
            'routes' => [
                [
                    'clientId' => 'main',
                    'name' => 'Main route',
                    'isMain' => true,
                    'displayOrder' => 1,
                    'steps' => [
                        ['clientId' => 'main-a', 'moveId' => (string) $fiveMk->getId()],
                        ['clientId' => 'main-b', 'moveId' => (string) $twoLp->getId()],
                    ],
                    'connections' => [[
                        'clientId' => 'main-link',
                        'sourceStepClientId' => 'main-a',
                        'destinationStepClientId' => 'main-b',
                        'type' => 'guaranteed',
                    ]],
                ],
                [
                    'clientId' => 'mash-callout',
                    'name' => 'Mash callout',
                    'isMain' => false,
                    'displayOrder' => 2,
                    'tacticalReasonText' => 'Use this route when the opponent challenges after 2LP.',
                    'branchAnchor' => ['connectionClientId' => 'main-link'],
                    'steps' => [
                        ['clientId' => 'mash-a', 'moveId' => (string) $fiveMk->getId()],
                        ['clientId' => 'mash-b', 'moveId' => (string) $twoLp->getId()],
                        ['clientId' => 'mash-c', 'moveId' => (string) $twoMk->getId()],
                        ['clientId' => 'mash-d', 'moveId' => (string) $run->getId()],
                    ],
                    'connections' => [
                        ['clientId' => 'mash-link-a', 'sourceStepClientId' => 'mash-a', 'destinationStepClientId' => 'mash-b', 'type' => 'guaranteed'],
                        ['clientId' => 'mash-gap', 'sourceStepClientId' => 'mash-b', 'destinationStepClientId' => 'mash-c', 'type' => 'gap', 'gapFrames' => 3, 'frameAdvantage' => -1, 'classification' => 'trades'],
                        ['clientId' => 'mash-confirm', 'sourceStepClientId' => 'mash-c', 'destinationStepClientId' => 'mash-d', 'type' => 'hit_confirm'],
                    ],
                ],
            ],
        ];

        $this->client->request('POST', '/api/blockstrings', [], [], $this->getHeaders(), json_encode($payload, JSON_THROW_ON_ERROR));
        $response = $this->client->getResponse();
        $created = json_decode((string) $response->getContent(), true);

        $this->assertSame(Response::HTTP_CREATED, $response->getStatusCode(), (string) $response->getContent());
        $this->assertSame('5MK TC -> 2LP', $created['notation']);
        $this->assertCount(2, $created['routes']);
        $this->assertTrue($created['routes'][0]['isMain']);
        $this->assertSame('Mash callout', $created['routes'][1]['name']);
        $this->assertSame('Use this route when the opponent challenges after 2LP.', $created['routes'][1]['tacticalReasonText']);
        $this->assertSame($created['routes'][0]['connections'][0]['id'], $created['routes'][1]['branchAnchor']['connectionId']);
        $this->assertSame('gap', $created['routes'][1]['connections'][1]['type']);
        $this->assertSame(3, $created['routes'][1]['connections'][1]['gap']['frames']);
        $this->assertSame('hit_confirm', $created['routes'][1]['connections'][2]['type']);
    }

    public function testAlternativeRouteRequiresTacticalReason(): void
    {
        $this->addContentTypeJsonToHeaders();
        $character = (new Character())->setName('Ryu');
        $move = (new Move())->setCharacter($character)->setNumpadNotation('2LP');
        $this->entityManager->persist($character);
        $this->entityManager->persist($move);
        $this->entityManager->flush();

        $payload = [
            'title' => 'Invalid route reason',
            'attackerCharacterId' => (string) $character->getId(),
            'classification' => 'fake',
            'routes' => [
                ['clientId' => 'main', 'isMain' => true, 'steps' => [['clientId' => 'main-a', 'moveId' => (string) $move->getId()]]],
                ['clientId' => 'alt', 'isMain' => false, 'steps' => [['clientId' => 'alt-a', 'moveId' => (string) $move->getId()]]],
            ],
        ];

        $this->client->request('POST', '/api/blockstrings', [], [], $this->getHeaders(), json_encode($payload, JSON_THROW_ON_ERROR));

        $this->assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());
    }
}
