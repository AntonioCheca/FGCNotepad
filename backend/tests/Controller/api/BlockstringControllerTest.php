<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
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
        $this->entityManager->persist($character);
        $this->entityManager->persist($move);
        $this->entityManager->persist($jab);
        $this->entityManager->flush();

        $payload = [
            'title' => 'Akuma st.MP pressure',
            'summary' => 'Default pressure with a documented gap.',
            'attackerCharacterId' => (string) $character->getId(),
            'classification' => 'fake',
            'gapAfterStep' => 2,
            'maxInterruptStartup' => 5,
            'steps' => [
                ['moveId' => (string) $move->getId(), 'ordinal' => 1, 'canConfirmOnHit' => true],
                ['moveId' => (string) $jab->getId(), 'ordinal' => 2, 'gapBefore' => true, 'gapFrames' => 4],
            ],
            'offensePlans' => [[
                'label' => 'Default pressure',
                'planRole' => 'default',
                'targetBehavior' => 'Passive blocking',
                'purpose' => 'Observe the opponent before adapting.',
            ]],
            'defenseEntries' => [[
                'actAfterStep' => 1,
                'instruction' => 'Interrupt before LP connects.',
                'answers' => [[
                    'responseType' => 'button',
                    'startupFrames' => 5,
                    'outcome' => 'counter_hit',
                    'conversion' => 'CH light conversion',
                    'recommended' => true,
                ]],
            ]],
        ];

        $this->client->request('POST', '/api/blockstrings', [], [], $this->getHeaders(), json_encode($payload, JSON_THROW_ON_ERROR));
        $response = $this->client->getResponse();
        $created = json_decode((string) $response->getContent(), true);

        $this->assertSame(Response::HTTP_CREATED, $response->getStatusCode(), (string) $response->getContent());
        $this->assertSame('Akuma st.MP pressure', $created['title']);
        $this->assertSame('st.MP -> LP', $created['notation']);
        $this->assertSame('pending_review', $created['moderationState']);

        $this->client->request('GET', '/api/blockstrings?q=akuma', [], [], $this->getHeaders());
        $response = $this->client->getResponse();
        $searchPayload = json_decode((string) $response->getContent(), true);

        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());
        $this->assertCount(1, $searchPayload);
        $this->assertSame($created['id'], $searchPayload[0]['id']);
    }
}
