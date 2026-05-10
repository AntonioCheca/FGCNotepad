<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\ComboMetrics;
use App\Entity\ComboRequirement;
use App\Entity\RequirementSpecificCharacter;
use App\Entity\ComboSequences;
use App\Entity\ComboSequenceType;
use App\Entity\ConnectionType;
use App\Entity\FrameData;
use App\Entity\Move;
use App\Entity\Season;
use App\Entity\Step;
use App\Entity\User;
use App\Entity\Visibility;
use App\Tests\Controller\AuthenticatedWebTestCase;
use App\Util\Enum\ModerationState;
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

    public function testListSupportsComboFilters(): void
    {
        $comboType = new ComboSequenceType();
        $comboType->setName('combo');
        $this->entityManager->persist($comboType);

        $leafType = new ComboSequenceType();
        $leafType->setName('leaf');
        $this->entityManager->persist($leafType);

        $visibility = new Visibility();
        $visibility->setName('public');
        $this->entityManager->persist($visibility);

        $connectionType = new ConnectionType();
        $connectionType->setName('Initial Move');
        $this->entityManager->persist($connectionType);

        $character = new Character();
        $character->setName('Ryu');
        $this->entityManager->persist($character);

        $firstMove = $this->createLeafForFilters($character, $leafType, $visibility, '2MK', 'normal');
        $driveMove = $this->createLeafForFilters($character, $leafType, $visibility, 'Drive Rush', 'drive');

        $matching = $this->createComboForFilters(
            'Ryu Punish Starter',
            $comboType,
            $visibility,
            $firstMove,
            $driveMove,
            $connectionType,
            2400,
            6,
            true,
            true
        );

        $this->createComboForFilters(
            'Ryu Meterless',
            $comboType,
            $visibility,
            $firstMove,
            null,
            $connectionType,
            1200,
            2,
            false,
            false
        );

        $this->entityManager->flush();

        $this->client->request(
            'GET',
            sprintf(
                '/api/combo-sequences?q=punish&characterId=%s&firstMoveId=%s&minDamage=2000&maxDifficulty=7&counterHitRequired=true&isEssential=true&moveTypes[]=drive',
                urlencode((string) $character->getId()),
                urlencode((string) $firstMove->getMove()?->getId())
            ),
            [],
            [],
            $this->getHeaders(),
        );

        $response = $this->client->getResponse();
        $payload = json_decode((string) $response->getContent(), true);

        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());
        $this->assertCount(1, $payload);
        $this->assertSame($matching->getName(), $payload[0]['name']);
        $this->assertSame(ModerationState::APPROVED->value, $payload[0]['moderationState']);
    }

    public function testListIncludesOwnPendingCombosButHidesOthers(): void
    {
        $comboType = new ComboSequenceType();
        $comboType->setName('combo');
        $this->entityManager->persist($comboType);

        $visibility = new Visibility();
        $visibility->setName('public');
        $this->entityManager->persist($visibility);

        $currentUser = $this->entityManager->getRepository(User::class)->findOneBy(['username' => 'testuser']);
        $this->assertInstanceOf(User::class, $currentUser);
        $otherUser = (new User())
            ->setUsername('other_combo_author')
            ->setPassword(password_hash('testpassword', PASSWORD_BCRYPT));

        $ownPendingCombo = (new ComboSequences())
            ->setName('Own Pending Combo')
            ->setDescription('pending')
            ->setType($comboType)
            ->setVisibility($visibility)
            ->setAuthor($currentUser)
            ->setModerationState(ModerationState::PENDING_REVIEW->value);

        $otherPendingCombo = (new ComboSequences())
            ->setName('Other Pending Combo')
            ->setDescription('pending')
            ->setType($comboType)
            ->setVisibility($visibility)
            ->setAuthor($otherUser)
            ->setModerationState(ModerationState::PENDING_REVIEW->value);

        $this->entityManager->persist($otherUser);
        $this->entityManager->persist($ownPendingCombo);
        $this->entityManager->persist($otherPendingCombo);
        $this->entityManager->flush();

        $this->client->request('GET', '/api/combo-sequences', [], [], $this->getHeaders());

        $response = $this->client->getResponse();
        $payload = json_decode((string) $response->getContent(), true);
        $returnedNames = array_map(static fn (array $row): string => (string) ($row['name'] ?? ''), $payload);
        $ownPendingRows = array_values(array_filter(
            $payload,
            static fn (array $row): bool => 'Own Pending Combo' === ($row['name'] ?? null),
        ));

        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());
        $this->assertContains('Own Pending Combo', $returnedNames);
        $this->assertNotContains('Other Pending Combo', $returnedNames);
        $this->assertCount(1, $ownPendingRows);
        $this->assertSame(ModerationState::PENDING_REVIEW->value, $ownPendingRows[0]['moderationState']);
    }

    public function testListSupportsCombinedMoveTypeRequirementAndDifficultyFilters(): void
    {
        $comboType = new ComboSequenceType();
        $comboType->setName('combo');
        $this->entityManager->persist($comboType);

        $leafType = new ComboSequenceType();
        $leafType->setName('leaf');
        $this->entityManager->persist($leafType);

        $visibility = new Visibility();
        $visibility->setName('public');
        $this->entityManager->persist($visibility);

        $connectionType = new ConnectionType();
        $connectionType->setName('Initial Move');
        $this->entityManager->persist($connectionType);

        $character = new Character();
        $character->setName('Ken');
        $this->entityManager->persist($character);

        $firstMoveLeaf = $this->createLeafForFilters($character, $leafType, $visibility, '2MP', 'normal');
        $superLeaf = $this->createLeafForFilters($character, $leafType, $visibility, 'SA1', 'super');
        $driveLeaf = $this->createLeafForFilters($character, $leafType, $visibility, 'Drive Rush', 'drive');

        $expectedCombo = $this->createComboForFilters(
            'Ken Confirm Super',
            $comboType,
            $visibility,
            $firstMoveLeaf,
            $superLeaf,
            $connectionType,
            2100,
            5,
            true,
            true
        );

        $missingMetrics = new ComboSequences();
        $missingMetrics->setName('Ken Missing Metrics');
        $missingMetrics->setDescription('missing metrics');
        $missingMetrics->setType($comboType);
        $missingMetrics->setVisibility($visibility);
        $missingMetrics->setIsEssential(true);

        $missingMetricsRequirement = new ComboRequirement();
        $missingMetricsRequirement->setSequence($missingMetrics);
        $missingMetricsRequirement->setCounterHitRequired(true);
        $missingMetricsRequirement->setPunishCounterRequired(false);
        $missingMetricsRequirement->setCornerRequired(false);
        $missingMetricsRequirement->setAirborneRequired(false);
        $missingMetricsRequirement->setMidScreenRequired(false);
        $missingMetricsRequirement->setNotCrouchingRequired(false);
        $missingMetrics->setComboRequirement($missingMetricsRequirement);

        $missingMetricsStarter = new Step();
        $missingMetricsStarter->setParentSequence($missingMetrics);
        $missingMetricsStarter->setChildSequence($firstMoveLeaf);
        $missingMetricsStarter->setConnectionType($connectionType);
        $missingMetricsStarter->setOrdinalInCombo(1);
        $missingMetrics->addStep($missingMetricsStarter);

        $missingMetricsSecond = new Step();
        $missingMetricsSecond->setParentSequence($missingMetrics);
        $missingMetricsSecond->setChildSequence($superLeaf);
        $missingMetricsSecond->setConnectionType($connectionType);
        $missingMetricsSecond->setOrdinalInCombo(2);
        $missingMetrics->addStep($missingMetricsSecond);

        $this->entityManager->persist($missingMetricsRequirement);
        $this->entityManager->persist($missingMetrics);
        $this->entityManager->persist($missingMetricsStarter);
        $this->entityManager->persist($missingMetricsSecond);

        $tooHardCombo = $this->createComboForFilters(
            'Ken Too Hard',
            $comboType,
            $visibility,
            $firstMoveLeaf,
            $superLeaf,
            $connectionType,
            2500,
            8,
            true,
            true
        );

        $wrongRequirementCombo = $this->createComboForFilters(
            'Ken Wrong Requirement',
            $comboType,
            $visibility,
            $firstMoveLeaf,
            $superLeaf,
            $connectionType,
            2000,
            4,
            false,
            true
        );

        $wrongMoveTypeCombo = $this->createComboForFilters(
            'Ken Drive Route',
            $comboType,
            $visibility,
            $firstMoveLeaf,
            $driveLeaf,
            $connectionType,
            2200,
            5,
            true,
            true
        );

        $this->entityManager->flush();

        $this->client->request(
            'GET',
            sprintf(
                '/api/combo-sequences?characterId=%s&firstMoveId=%s&minDifficulty=3&maxDifficulty=6&counterHitRequired=true&moveTypes[]=super',
                urlencode((string) $character->getId()),
                urlencode((string) $firstMoveLeaf->getMove()?->getId())
            ),
            [],
            [],
            $this->getHeaders(),
        );

        $response = $this->client->getResponse();
        $payload = json_decode((string) $response->getContent(), true);

        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());
        $this->assertCount(1, $payload);
        $this->assertSame($expectedCombo->getName(), $payload[0]['name']);

        $returnedNames = array_map(static fn (array $row): string => (string) ($row['name'] ?? ''), $payload);
        $this->assertNotContains($missingMetrics->getName(), $returnedNames);
        $this->assertNotContains($tooHardCombo->getName(), $returnedNames);
        $this->assertNotContains($wrongRequirementCombo->getName(), $returnedNames);
        $this->assertNotContains($wrongMoveTypeCombo->getName(), $returnedNames);
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

    public function testTranslateNotationAutoCanonicalizesSfShortInput(): void
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
                'notation' => 'cr. lp > cr. lp xx qcf+mk',
            ])
        );

        $response = $this->client->getResponse();
        $payload = json_decode((string) $response->getContent(), true);

        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());
        $this->assertCount(3, $payload['steps']);
        $this->assertSame('Initial Move', $payload['steps'][0]['connection_type_name']);
        $this->assertSame('Special', $payload['steps'][1]['connection_type_name']);
        $this->assertSame('Special', $payload['steps'][2]['connection_type_name']);
        $this->assertSame([], $payload['errors']);
        $this->assertSame('cr. lp > cr. lp xx qcf+mk', $payload['input']['rawNotation']);
        $this->assertSame('2LP XX 2LP XX 236MK', $payload['input']['canonicalNotation']);
    }

    public function testTranslateNotationResolvesContextualTargetComboComposite(): void
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
                'notation' => 'cr. mp, mp xx mp xx srk+hp',
            ])
        );

        $response = $this->client->getResponse();
        $payload = json_decode((string) $response->getContent(), true);

        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());
        $this->assertCount(3, $payload['steps']);
        $this->assertSame([], $payload['errors']);
        $this->assertSame('2MP', $payload['steps'][0]['token']);
        $this->assertSame('5MP > MP', $payload['steps'][1]['token']);
        $this->assertSame('623HP', $payload['steps'][2]['token']);
        $this->assertSame('2MP 5MP XX 5MP XX 623HP', $payload['input']['canonicalNotation']);
    }

    public function testEstimateDamageUsesContextualTargetComboComposite(): void
    {
        $character = $this->seedTranslationData();

        $this->client->request(
            'POST',
            '/api/combo-sequences/estimate-damage',
            [],
            [],
            $this->getJsonHeaders(),
            json_encode([
                'characterId' => (string) $character->getId(),
                'notation' => 'cr. mp, mp xx mp xx srk+hp',
            ])
        );

        $response = $this->client->getResponse();
        $payload = json_decode((string) $response->getContent(), true);

        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());
        $this->assertSame(2660, $payload['estimatedDamage']);
        $this->assertSame([600, 1160, 900], $payload['stepDamages']);
        $this->assertSame('5MP > MP', $payload['steps'][1]['token']);
        $this->assertSame([], $payload['errors']);
    }

    public function testEstimateDamageUsesDirectionalTargetComboComposite(): void
    {
        $character = $this->seedTranslationData();

        $this->client->request(
            'POST',
            '/api/combo-sequences/estimate-damage',
            [],
            [],
            $this->getJsonHeaders(),
            json_encode([
                'characterId' => (string) $character->getId(),
                'notation' => 'f+hp xx f+hp, srk+mp',
            ])
        );

        $response = $this->client->getResponse();
        $payload = json_decode((string) $response->getContent(), true);

        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());
        $this->assertSame(2440, $payload['estimatedDamage']);
        $this->assertSame([1400, 1040], $payload['stepDamages']);
        $this->assertSame('6HP XX 6HP', $payload['steps'][0]['token']);
        $this->assertSame([], $payload['errors']);
    }

    public function testEstimateDamageUsesGenericStrengthFallbackForSpecialFollowUp(): void
    {
        $character = $this->seedTranslationData();

        $this->client->request(
            'POST',
            '/api/combo-sequences/estimate-damage',
            [],
            [],
            $this->getJsonHeaders(),
            json_encode([
                'characterId' => (string) $character->getId(),
                'notation' => 'b+hk xx qcf+hk xx p',
            ])
        );

        $response = $this->client->getResponse();
        $payload = json_decode((string) $response->getContent(), true);

        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());
        $this->assertSame(1840, $payload['estimatedDamage']);
        $this->assertSame([800, 1040], $payload['stepDamages']);
        $this->assertSame('236K > P', $payload['steps'][1]['token']);
        $this->assertSame([], $payload['errors']);
    }

    public function testEstimateDamageReturnsDeterministicDamage(): void
    {
        $character = $this->seedTranslationData();

        $this->client->request(
            'POST',
            '/api/combo-sequences/estimate-damage',
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
        $this->assertSame(3, count($payload['stepDamages']));
        $this->assertSame(890, $payload['estimatedDamage']);
    }

    public function testEstimateResourcesReturnsDerivedMetricsFromOnHitData(): void
    {
        $character = $this->seedTranslationData();

        $this->client->request(
            'POST',
            '/api/combo-sequences/estimate-resources',
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
        $this->assertEquals(0.0, $payload['driveUsed']);
        $this->assertEquals(0.338, $payload['driveGain']);
        $this->assertEquals(0.0, $payload['superUsed']);
        $this->assertEquals(0.09, $payload['superGain']);
        $this->assertSame(72, $payload['totalFrames']);
    }

    public function testEstimateDamageAppliesScalingComboHitsFromFrameData(): void
    {
        $character = $this->seedScalingEstimateData();

        $this->client->request(
            'POST',
            '/api/combo-sequences/estimate-damage',
            [],
            [],
            $this->getJsonHeaders(),
            json_encode([
                'characterId' => (string) $character->getId(),
                'notation' => '2LP, 2LP, 5LK XX 214LK, 2HK',
            ])
        );

        $response = $this->client->getResponse();
        $payload = json_decode((string) $response->getContent(), true);

        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());
        $this->assertSame([300, 240, 210, 360, 360], $payload['stepDamages']);
        $this->assertSame(1470, $payload['estimatedDamage']);
    }

    public function testEstimateResourcesUsesSuperMeterDeltaForSuperCostAndDoesNotUseDriveDamageAsDriveCost(): void
    {
        $character = $this->seedAkumaResourceEstimateData();

        $this->client->request(
            'POST',
            '/api/combo-sequences/estimate-resources',
            [],
            [],
            $this->getJsonHeaders(),
            json_encode([
                'characterId' => (string) $character->getId(),
                'notation' => '2LK, 2LP, 5LK XX 214LK, 236236P',
            ])
        );

        $response = $this->client->getResponse();
        $payload = json_decode((string) $response->getContent(), true);

        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());
        $this->assertEquals(0.0, $payload['driveUsed']);
        $this->assertEquals(1.0, $payload['superUsed']);
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

    public function testCreateFullComboPersistsResourceMetrics(): void
    {
        [$leafSequence, $connectionType] = $this->seedCreateFullComboData();

        $payload = [
            'name' => 'Resource Combo',
            'metrics' => [
                'damage' => 2400,
                'driveCost' => 2.5,
                'driveGain' => 0.5,
                'superCost' => 1,
                'superGain' => 0,
            ],
            'steps' => [
                [
                    'child_sequence_id' => $leafSequence->getId(),
                    'ordinal_in_combo' => 1,
                    'connection_type_id' => $connectionType->getId(),
                ],
            ],
        ];

        $this->client->request('POST', '/api/combo-sequences/full', [], [], $this->getJsonHeaders(), json_encode($payload));

        $response = $this->client->getResponse();
        $responsePayload = json_decode((string) $response->getContent(), true);

        $this->assertSame(Response::HTTP_CREATED, $response->getStatusCode());
        $this->assertSame(2400, $responsePayload['comboMetrics']['damage']);
        $this->assertEquals(2.5, $responsePayload['comboMetrics']['driveCost']);
        $this->assertEquals(0.5, $responsePayload['comboMetrics']['driveGain']);
        $this->assertEquals(1.0, $responsePayload['comboMetrics']['superCost']);
        $this->assertEquals(0.0, $responsePayload['comboMetrics']['superGain']);
        $this->assertEquals(1500.0, $responsePayload['comboMetrics']['resourceAdjustedDamage']);
    }

    public function testListCanSortByResourceAdjustedDamage(): void
    {
        $comboType = new ComboSequenceType();
        $comboType->setName('combo');
        $this->entityManager->persist($comboType);

        $leafType = new ComboSequenceType();
        $leafType->setName('leaf');
        $this->entityManager->persist($leafType);

        $visibility = new Visibility();
        $visibility->setName('public');
        $this->entityManager->persist($visibility);

        $connectionType = new ConnectionType();
        $connectionType->setName('Initial Move');
        $this->entityManager->persist($connectionType);

        $character = new Character();
        $character->setName('Luke');
        $this->entityManager->persist($character);

        $firstMove = $this->createLeafForFilters($character, $leafType, $visibility, '5MP', 'normal');

        $this->createComboForFilters('Expensive Damage', $comboType, $visibility, $firstMove, null, $connectionType, 2500, 3, false, false, 3.0, 0.0, 1.0, 0.0);
        $this->createComboForFilters('Efficient Damage', $comboType, $visibility, $firstMove, null, $connectionType, 2000, 3, false, false);

        $this->entityManager->flush();

        $this->client->request('GET', '/api/combo-sequences?sort=resourceAdjustedDamage', [], [], $this->getHeaders());

        $response = $this->client->getResponse();
        $payload = json_decode((string) $response->getContent(), true);

        $this->assertSame(Response::HTTP_OK, $response->getStatusCode());
        $this->assertSame('Efficient Damage', $payload[0]['name']);
        $this->assertEquals(2000.0, $payload[0]['comboMetrics']['resourceAdjustedDamage']);
        $this->assertEquals(1400.0, $payload[1]['comboMetrics']['resourceAdjustedDamage']);
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
        $this->assertFalse($step->isDelayMinUnverified());
        $this->assertFalse($step->isDelayMaxUnverified());
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
        $this->assertFalse($step->isDelayMinUnverified());
        $this->assertFalse($step->isDelayMaxUnverified());
    }

    public function testCreateFullComboPersistsPartiallyVerifiedDelayWindowFrames(): void
    {
        [$leafSequence, $initialConnectionType] = $this->seedCreateFullComboData();
        $delayConnectionType = $this->persistConnectionType('Delay');
        $this->entityManager->flush();

        $payload = [
            'name' => 'Partially Verified Delay Combo',
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
                    'delay_min_frames' => 4,
                    'delay_max_frames' => 4,
                    'delay_min_unverified' => true,
                    'delay_max_unverified' => true,
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
        $this->assertFalse($responsePayload['is_fully_audited']);
        $this->assertTrue($responsePayload['needs_technical_review']);
        $this->assertTrue($responsePayload['is_usable']);
        $this->assertTrue($responsePayload['steps'][1]['delay_min_unverified']);
        $this->assertTrue($responsePayload['steps'][1]['delay_max_unverified']);

        $createdSequence = $this->entityManager->getRepository(ComboSequences::class)->find($responsePayload['id']);
        $this->assertInstanceOf(ComboSequences::class, $createdSequence);

        $step = $this->findStepByOrdinal($createdSequence, 2);
        $this->assertSame(4, $step->getDelayMinFrames());
        $this->assertSame(4, $step->getDelayMaxFrames());
        $this->assertTrue($step->isDelayMinUnverified());
        $this->assertTrue($step->isDelayMaxUnverified());
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

    public function testCreateFullComboRejectsUnverifiedDelayFlagsWhenUsingDelayFrames(): void
    {
        [$leafSequence, $initialConnectionType] = $this->seedCreateFullComboData();
        $delayConnectionType = $this->persistConnectionType('Delay');
        $this->entityManager->flush();

        $payload = [
            'name' => 'Invalid Delay Flags Combo',
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
                    'delay_frames' => 4,
                    'delay_min_unverified' => true,
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

        $this->persistLeafSequence($character, $leafType, $visibility, '2LP', 'normal', '["ch","sp","su"]', 300, null, null, null, null, null, null, 4, 2, 8, 10, 200, 100, 300);
        $this->persistLeafSequence($character, $leafType, $visibility, '2MP', 'normal', '["sp","su"]', 600, null, null, null, null, null, null, 6, 3, 10, 14, 200, 100, 300);
        $this->persistLeafSequence($character, $leafType, $visibility, '5MP', 'normal', '["sp","su"]', 600, null, null, null, null, null, null, 5, 3, 9, 12, 200, 100, 300, 16);
        $this->persistLeafSequence($character, $leafType, $visibility, '5MP > MP', 'normal', '["sp","su"]', 1300, null, null, null, 2, null, null, 11, 5, 12, 20, 300, 200, 500, null, '[{"fatDamageParts":[600,700]}]');
        $this->persistLeafSequence($character, $leafType, $visibility, '6HP', 'normal', '["tc"]', 800, null, null, null, null, null, null, 12, 3, 12, 18, 300, 200, 500);
        $this->persistLeafSequence($character, $leafType, $visibility, '6HP > 6HP', 'normal', '["tc"]', 1400, null, null, null, null, null, null, 12, 3, 12, 18, 300, 200, 500, null, '[{"fatDamageParts":[800,600]}]');
        $this->persistLeafSequence($character, $leafType, $visibility, '4HK', 'normal', '["sp","su"]', 800, 20, null, null, null, null, null, 12, 3, 12, 18, 300, 200, 500);
        $this->persistLeafSequence($character, $leafType, $visibility, '236K', 'special', '[]', 0, null, null, null, null, null, null, 12, 3, 12, 18, 300, 200, 500);
        $this->persistLeafSequence($character, $leafType, $visibility, '236K > P', 'special', '[]', 1300, null, null, null, null, null, null, 12, 3, 12, 18, 300, 200, 500);
        $this->persistLeafSequence($character, $leafType, $visibility, '236MK', 'special', '["su"]', 500, null, null, null, null, null, null, 10, 3, 10, 15, 100, 100, 300);
        $this->persistLeafSequence($character, $leafType, $visibility, '623MP', 'special', '["su"]', 1300, 20, null, null, null, null, null, 7, 6, 12, 18, 100, 100, 300);
        $this->persistLeafSequence($character, $leafType, $visibility, '623HP', 'special', '["su"]', 1500, null, null, null, null, null, null, 8, 6, 14, 20, 100, 100, 300);

        $this->entityManager->flush();

        return $character;
    }

    private function seedScalingEstimateData(): Character
    {
        $character = new Character();
        $character->setName('Akuma');
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

        $this->persistLeafSequence($character, $leafType, $visibility, '2LP', 'normal', '["ch","sp","su"]', 300, null, null, null, null, null, null);
        $this->persistLeafSequence($character, $leafType, $visibility, '5LK', 'normal', '["sp","su"]', 300, null, null, null, null, null, null);
        $this->persistLeafSequence($character, $leafType, $visibility, '214LK', 'special', '["su"]', 600, null, null, null, 2, null, null);
        $this->persistLeafSequence($character, $leafType, $visibility, '2HK', 'normal', null, 900, null, null, null, null, null, null);

        $this->entityManager->flush();

        return $character;
    }

    private function seedAkumaResourceEstimateData(): Character
    {
        $character = new Character();
        $character->setName('Akuma');
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
        $this->persistConnectionType('Super');
        $this->persistConnectionType('Target Combo');
        $this->persistConnectionType('Link');

        $this->persistLeafSequence($character, $leafType, $visibility, '2LK', 'normal', '["ch","sp","su"]', 250, null, null, null, null, null, null, 5, 2, 8, 9, 150, 300, 300);
        $this->persistLeafSequence($character, $leafType, $visibility, '2LP', 'normal', '["ch","sp","su"]', 300, null, null, null, null, null, null, 4, 2, 8, 10, 150, 300, 300);
        $this->persistLeafSequence($character, $leafType, $visibility, '5LK', 'normal', '["sp","su"]', 300, null, null, null, null, null, null, 6, 2, 8, 11, 150, 300, 300);
        $this->persistLeafSequence($character, $leafType, $visibility, '214LK', 'special', '["su"]', 600, null, null, null, null, null, null, 12, 3, 10, 16, 250, 400, 400);
        $this->persistLeafSequence($character, $leafType, $visibility, '236236P', 'super', null, 2000, null, null, null, null, null, null, 8, 8, 20, 30, 0, 500, -10000);

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
        string $moveType,
        ?string $cancelsTo = null,
        int $damage = 0,
        ?int $scalingStartPercent = null,
        ?int $scalingImmediatePercent = null,
        ?int $scalingMinimumPercent = null,
        ?int $scalingComboHits = null,
        ?int $scalingComboExtraPercent = null,
        ?int $scalingMultiplierPercent = null,
        ?int $startup = null,
        ?int $active = null,
        ?int $hitstop = null,
        ?int $recovery = null,
        ?int $driveGain = null,
        ?int $driveDamageOnHit = null,
        ?int $onHitSelfSuperMeterGain = null,
        ?int $hitConfirmTargetCombos = null,
        ?string $extraInformation = null,
    ): void
    {
        $move = new Move();
        $move->setCharacter($character);
        $move->setNumpadNotation($notation);

        $frameData = new FrameData();
        $frameData->setMoveType($moveType);
        $frameData->setDamage($damage);
        if (null !== $cancelsTo) {
            $frameData->setCancelsTo($cancelsTo);
        }
        $frameData->setScalingStartPercent($scalingStartPercent);
        $frameData->setScalingImmediatePercent($scalingImmediatePercent);
        $frameData->setScalingMinimumPercent($scalingMinimumPercent);
        $frameData->setScalingComboHits($scalingComboHits);
        $frameData->setScalingComboExtraPercent($scalingComboExtraPercent);
        $frameData->setScalingMultiplierPercent($scalingMultiplierPercent);
        if (null !== $startup) {
            $frameData->setStartup($startup);
        }
        if (null !== $active) {
            $frameData->setActive($active);
        }
        if (null !== $hitstop) {
            $frameData->setHitstop($hitstop);
        }
        if (null !== $recovery) {
            $frameData->setRecovery($recovery);
        }
        if (null !== $driveGain) {
            $frameData->setDriveGain($driveGain);
        }
        if (null !== $driveDamageOnHit) {
            $frameData->setDriveDamageOnHit($driveDamageOnHit);
        }
        if (null !== $onHitSelfSuperMeterGain) {
            $frameData->setOnHitSelfSuperMeterGain($onHitSelfSuperMeterGain);
        }
        if (null !== $hitConfirmTargetCombos) {
            $frameData->setHitConfirmTargetCombos($hitConfirmTargetCombos);
        }
        if (null !== $extraInformation) {
            $frameData->setExtraInformation($extraInformation);
        }
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

    private function createLeafForFilters(
        Character $character,
        ComboSequenceType $leafType,
        Visibility $visibility,
        string $notation,
        string $moveType
    ): ComboSequences {
        $move = new Move();
        $move->setCharacter($character);
        $move->setNumpadNotation($notation);

        $frameData = new FrameData();
        $frameData->setMoveType($moveType);
        $move->setFrameData($frameData);

        $leafSequence = new ComboSequences();
        $leafSequence->setName(sprintf('%s %s', $character->getName(), $notation));
        $leafSequence->setDescription('leaf');
        $leafSequence->setMove($move);
        $leafSequence->setType($leafType);
        $leafSequence->setVisibility($visibility);

        $this->entityManager->persist($move);
        $this->entityManager->persist($frameData);
        $this->entityManager->persist($leafSequence);

        return $leafSequence;
    }

    private function createComboForFilters(
        string $name,
        ComboSequenceType $comboType,
        Visibility $visibility,
        ComboSequences $firstMove,
        ?ComboSequences $secondMove,
        ConnectionType $connectionType,
        int $damage,
        int $difficulty,
        bool $counterHitRequired,
        bool $isEssential,
        ?float $driveCost = null,
        ?float $driveGain = null,
        ?float $superCost = null,
        ?float $superGain = null
    ): ComboSequences {
        $combo = new ComboSequences();
        $combo->setName($name);
        $combo->setDescription('test combo');
        $combo->setType($comboType);
        $combo->setVisibility($visibility);
        $combo->setIsEssential($isEssential);

        $metrics = new ComboMetrics();
        $metrics->setSequence($combo);
        $metrics->setDamage($damage);
        $metrics->setDifficultyLevel($difficulty);
        $metrics->setDriveCost($driveCost);
        $metrics->setDriveGain($driveGain);
        $metrics->setSuperCost($superCost);
        $metrics->setSuperGain($superGain);
        $combo->setComboMetrics($metrics);

        $requirement = new ComboRequirement();
        $requirement->setSequence($combo);
        $requirement->setCounterHitRequired($counterHitRequired);
        $requirement->setPunishCounterRequired(false);
        $requirement->setCornerRequired(false);
        $requirement->setAirborneRequired(false);
        $requirement->setMidScreenRequired(false);
        $requirement->setNotCrouchingRequired(false);
        $combo->setComboRequirement($requirement);

        $starterStep = new Step();
        $starterStep->setParentSequence($combo);
        $starterStep->setChildSequence($firstMove);
        $starterStep->setConnectionType($connectionType);
        $starterStep->setOrdinalInCombo(1);
        $combo->addStep($starterStep);

        if (null !== $secondMove) {
            $secondStep = new Step();
            $secondStep->setParentSequence($combo);
            $secondStep->setChildSequence($secondMove);
            $secondStep->setConnectionType($connectionType);
            $secondStep->setOrdinalInCombo(2);
            $combo->addStep($secondStep);
            $this->entityManager->persist($secondStep);
        }

        $this->entityManager->persist($metrics);
        $this->entityManager->persist($requirement);
        $this->entityManager->persist($combo);
        $this->entityManager->persist($starterStep);

        return $combo;
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
