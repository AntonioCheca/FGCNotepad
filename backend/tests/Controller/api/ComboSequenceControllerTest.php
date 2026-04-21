<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\ComboRequirement;
use App\Entity\RequirementSpecificCharacter;
use App\Entity\ComboSequences;
use App\Entity\ComboSequenceType;
use App\Entity\ConnectionType;
use App\Entity\FrameData;
use App\Entity\Move;
use App\Entity\Season;
use App\Entity\Step;
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
        $payload = json_decode((string) $response->getContent(), true);

        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());
        $this->assertSame([], $payload);
    }

    public function testListLeafsByCharacterId(): void
    {
        [$leafSequence] = $this->seedCreateFullComboData();
        $characterId = (string) $leafSequence->getMove()?->getCharacter()?->getId();

        $this->client->request(
            'GET',
            sprintf('/api/combo-sequences/leafs/list?character_id=%s', urlencode($characterId)),
            [],
            [],
            $this->getHeaders(),
        );

        $response = $this->client->getResponse();
        $payload = json_decode((string) $response->getContent(), true);

        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());
        $this->assertIsArray($payload);
        $this->assertNotEmpty($payload);
        $this->assertSame($characterId, $payload[0]['character']['id']);
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

    public function testCreateFullComboPersistsRequirementsAndSpecificCharacter(): void
    {
        [$leafSequence, $connectionType] = $this->seedCreateFullComboData();

        $payload = [
            'name' => 'Jamie Drink Combo',
            'description' => 'Only works at 2 drinks',
            'requirements' => [
                'counter_hit_required' => true,
                'punish_counter_required' => false,
                'corner_required' => false,
                'airborne_required' => false,
                'mid_screen_required' => true,
                'not_crouching_required' => true,
                'requirement_specific_character' => [
                    'object_name' => 'Drinks',
                    'status_required' => '2',
                ],
            ],
            'steps' => [
                [
                    'child_sequence_id' => $leafSequence->getId(),
                    'ordinal_in_combo' => 1,
                    'connection_type_id' => $connectionType->getId(),
                ],
            ],
        ];

        $this->client->request(
            'POST',
            '/api/combo-sequences/full',
            [],
            [],
            $this->getJsonHeaders(),
            json_encode($payload)
        );

        $response = $this->client->getResponse();
        $responsePayload = json_decode((string) $response->getContent(), true);

        $this->assertSame(Response::HTTP_CREATED, $response->getStatusCode());
        $this->assertIsArray($responsePayload);
        $this->assertArrayHasKey('id', $responsePayload);

        $createdSequence = $this->entityManager->getRepository(ComboSequences::class)->find($responsePayload['id']);
        $this->assertInstanceOf(ComboSequences::class, $createdSequence);

        $persistedRequirement = $this->entityManager->getRepository(ComboRequirement::class)->findOneBy([
            'sequence' => $createdSequence,
        ]);
        $this->assertInstanceOf(ComboRequirement::class, $persistedRequirement);
        $this->assertTrue($persistedRequirement->isCounterHitRequired());
        $this->assertTrue($persistedRequirement->isMidScreenRequired());
        $this->assertTrue($persistedRequirement->isNotCrouchingRequired());

        $specificRequirement = $this->entityManager->getRepository(RequirementSpecificCharacter::class)->findOneBy([
            'requirement' => $persistedRequirement,
        ]);
        $this->assertInstanceOf(RequirementSpecificCharacter::class, $specificRequirement);
        $this->assertSame('Drinks', $specificRequirement->getObjectName());
        $this->assertSame('2', $specificRequirement->getStatusRequired());
    }

    public function testCreateFullComboRejectsCounterAndPunishCounterAtSameTime(): void
    {
        [$leafSequence, $connectionType] = $this->seedCreateFullComboData();

        $payload = [
            'name' => 'Invalid Counter Flags',
            'requirements' => [
                'counter_hit_required' => true,
                'punish_counter_required' => true,
            ],
            'steps' => [
                [
                    'child_sequence_id' => $leafSequence->getId(),
                    'ordinal_in_combo' => 1,
                    'connection_type_id' => $connectionType->getId(),
                ],
            ],
        ];

        $this->client->request(
            'POST',
            '/api/combo-sequences/full',
            [],
            [],
            $this->getJsonHeaders(),
            json_encode($payload)
        );

        $response = $this->client->getResponse();

        $this->assertSame(Response::HTTP_BAD_REQUEST, $response->getStatusCode());
    }

    public function testCreateFullComboPersistsFixedDelayFrames(): void
    {
        [$leafSequence, $initialConnectionType] = $this->seedCreateFullComboData();
        $delayConnectionType = $this->persistConnectionType('Delay');
        $this->entityManager->flush();

        $payload = [
            'name' => 'Fixed Delay Combo',
            'steps' => [
                [
                    'child_sequence_id' => $leafSequence->getId(),
                    'ordinal_in_combo' => 1,
                    'connection_type_id' => $initialConnectionType->getId(),
                ],
                [
                    'child_sequence_id' => $leafSequence->getId(),
                    'ordinal_in_combo' => 2,
                    'connection_type_id' => $delayConnectionType->getId(),
                    'delay_frames' => 120,
                ],
            ],
        ];

        $this->client->request(
            'POST',
            '/api/combo-sequences/full',
            [],
            [],
            $this->getJsonHeaders(),
            json_encode($payload)
        );

        $response = $this->client->getResponse();
        $responsePayload = json_decode((string) $response->getContent(), true);

        $this->assertSame(Response::HTTP_CREATED, $response->getStatusCode());

        $createdSequence = $this->entityManager->getRepository(ComboSequences::class)->find($responsePayload['id']);
        $this->assertInstanceOf(ComboSequences::class, $createdSequence);

        $step = $this->findStepByOrdinal($createdSequence, 2);
        $this->assertSame(120, $step->getDelayMinFrames());
        $this->assertSame(120, $step->getDelayMaxFrames());
        $this->assertSame('Delay', $step->getConnectionType()?->getName());
    }

    public function testCreateFullComboPersistsDelayWindowFrames(): void
    {
        [$leafSequence, $initialConnectionType] = $this->seedCreateFullComboData();
        $delayConnectionType = $this->persistConnectionType('Delay');
        $this->entityManager->flush();

        $payload = [
            'name' => 'Window Delay Combo',
            'steps' => [
                [
                    'child_sequence_id' => $leafSequence->getId(),
                    'ordinal_in_combo' => 1,
                    'connection_type_id' => $initialConnectionType->getId(),
                ],
                [
                    'child_sequence_id' => $leafSequence->getId(),
                    'ordinal_in_combo' => 2,
                    'connection_type_id' => $delayConnectionType->getId(),
                    'delay_min_frames' => 3,
                    'delay_max_frames' => 7,
                ],
            ],
        ];

        $this->client->request(
            'POST',
            '/api/combo-sequences/full',
            [],
            [],
            $this->getJsonHeaders(),
            json_encode($payload)
        );

        $response = $this->client->getResponse();
        $responsePayload = json_decode((string) $response->getContent(), true);

        $this->assertSame(Response::HTTP_CREATED, $response->getStatusCode());

        $createdSequence = $this->entityManager->getRepository(ComboSequences::class)->find($responsePayload['id']);
        $this->assertInstanceOf(ComboSequences::class, $createdSequence);

        $step = $this->findStepByOrdinal($createdSequence, 2);
        $this->assertSame(3, $step->getDelayMinFrames());
        $this->assertSame(7, $step->getDelayMaxFrames());
    }

    public function testCreateFullComboRejectsDelayFramesWhenConnectionIsNotDelay(): void
    {
        [$leafSequence, $initialConnectionType] = $this->seedCreateFullComboData();

        $payload = [
            'name' => 'Invalid Delay Connection Combo',
            'steps' => [
                [
                    'child_sequence_id' => $leafSequence->getId(),
                    'ordinal_in_combo' => 1,
                    'connection_type_id' => $initialConnectionType->getId(),
                    'delay_frames' => 5,
                ],
            ],
        ];

        $this->client->request(
            'POST',
            '/api/combo-sequences/full',
            [],
            [],
            $this->getJsonHeaders(),
            json_encode($payload)
        );

        $response = $this->client->getResponse();

        $this->assertSame(Response::HTTP_BAD_REQUEST, $response->getStatusCode());
    }

    public function testCreateFullComboRejectsInvalidDelayWindow(): void
    {
        [$leafSequence, $initialConnectionType] = $this->seedCreateFullComboData();
        $delayConnectionType = $this->persistConnectionType('Delay');
        $this->entityManager->flush();

        $payload = [
            'name' => 'Invalid Delay Window Combo',
            'steps' => [
                [
                    'child_sequence_id' => $leafSequence->getId(),
                    'ordinal_in_combo' => 1,
                    'connection_type_id' => $initialConnectionType->getId(),
                ],
                [
                    'child_sequence_id' => $leafSequence->getId(),
                    'ordinal_in_combo' => 2,
                    'connection_type_id' => $delayConnectionType->getId(),
                    'delay_min_frames' => 10,
                    'delay_max_frames' => 2,
                ],
            ],
        ];

        $this->client->request(
            'POST',
            '/api/combo-sequences/full',
            [],
            [],
            $this->getJsonHeaders(),
            json_encode($payload)
        );

        $response = $this->client->getResponse();

        $this->assertSame(Response::HTTP_BAD_REQUEST, $response->getStatusCode());
    }

    public function testListRequirementObjectsReturnsCatalog(): void
    {
        $this->client->request(
            'GET',
            '/api/combo-sequences/requirements/objects',
            [],
            [],
            $this->getHeaders(),
        );

        $response = $this->client->getResponse();
        $payload = json_decode((string) $response->getContent(), true);

        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());
        $this->assertIsArray($payload);
        $drinks = array_values(array_filter($payload, static fn (array $item): bool => $item['name'] === 'Drinks'));
        $denjin = array_values(array_filter($payload, static fn (array $item): bool => $item['name'] === 'Denjin Charge'));

        $this->assertCount(1, $drinks);
        $this->assertSame('integer', $drinks[0]['status_type']);
        $this->assertSame(4, $drinks[0]['max_status']);

        $this->assertCount(1, $denjin);
        $this->assertSame('boolean', $denjin[0]['status_type']);
        $this->assertNull($denjin[0]['max_status']);
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

    private function persistConnectionType(string $name): ConnectionType
    {
        $connectionType = new ConnectionType();
        $connectionType->setName($name);
        $this->entityManager->persist($connectionType);

        return $connectionType;
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

    /**
     * @return array{0: ComboSequences, 1: ConnectionType}
     */
    private function seedCreateFullComboData(): array
    {
        $character = new Character();
        $character->setName('Jamie');
        $this->entityManager->persist($character);

        $comboType = new ComboSequenceType();
        $comboType->setName('combo');
        $this->entityManager->persist($comboType);

        $leafType = new ComboSequenceType();
        $leafType->setName('leaf');
        $this->entityManager->persist($leafType);

        $visibility = new Visibility();
        $visibility->setName('public');
        $this->entityManager->persist($visibility);

        $season = new Season();
        $season->setName('S1');
        $season->setStartDate(new \DateTimeImmutable('2025-01-01'));
        $this->entityManager->persist($season);

        $connectionType = new ConnectionType();
        $connectionType->setName('Initial Move');
        $this->entityManager->persist($connectionType);

        $move = new Move();
        $move->setCharacter($character);
        $move->setNumpadNotation('2LP');
        $this->entityManager->persist($move);

        $frameData = new FrameData();
        $frameData->setMoveType('normal');
        $move->setFrameData($frameData);
        $this->entityManager->persist($frameData);

        $leafSequence = new ComboSequences();
        $leafSequence->setName('Jamie 2LP')
            ->setDescription('leaf')
            ->setMove($move)
            ->setType($leafType)
            ->setVisibility($visibility)
            ->addSeason($season);
        $this->entityManager->persist($leafSequence);

        $this->entityManager->flush();

        return [$leafSequence, $connectionType];
    }

    private function findStepByOrdinal(ComboSequences $sequence, int $ordinal): Step
    {
        foreach ($sequence->getSteps() as $step) {
            if ($step->getOrdinalInCombo() === $ordinal) {
                return $step;
            }
        }

        $this->fail(sprintf('Could not find step with ordinal %d.', $ordinal));
        throw new \RuntimeException('Unreachable');
    }
}
