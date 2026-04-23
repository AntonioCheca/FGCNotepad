<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\ComboMetrics;
use App\Entity\ComboRequirement;
use App\Entity\ComboSequences;
use App\Entity\ComboSequenceType;
use App\Entity\ConnectionType;
use App\Entity\FrameData;
use App\Entity\Move;
use App\Entity\Scenario;
use App\Entity\Step;
use App\Entity\User;
use App\Entity\UserCombo;
use App\Entity\Visibility;
use App\Tests\Controller\AuthenticatedWebTestCase;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Uid\Uuid;

class ScenarioControllerTest extends AuthenticatedWebTestCase
{
    private EntityManagerInterface $em;

    public function setUp(): void
    {
        parent::setUp();
        $this->em = static::getContainer()->get(EntityManagerInterface::class);
    }

    public function testCreateAndReadScenario(): void
    {
        [$defender, $attacker, $triggerMove] = $this->createScenarioActors();

        $this->client->request('POST', '/api/scenarios', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'name' => 'Corner Oki Test',
            'scenarioType' => 'oki',
            'defenderCharacterId' => $defender->getId()?->toRfc4122(),
            'attackerCharacterId' => $attacker->getId()?->toRfc4122(),
            'triggerMoveId' => $triggerMove->getId()?->toRfc4122(),
            'matrix' => $this->buildMatrixPayload(),
        ]));

        self::assertSame(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode());
        $created = json_decode((string) $this->client->getResponse()->getContent(), true);

        $this->client->request('GET', '/api/scenarios/' . $created['id']);
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertSame('Corner Oki Test', $payload['name']);
        self::assertSame('oki', $payload['scenarioType']);
        self::assertSame($defender->getId()?->toRfc4122(), $payload['defenderCharacterId']);
        self::assertSame($attacker->getId()?->toRfc4122(), $payload['attackerCharacterId']);
        self::assertSame($triggerMove->getId()?->toRfc4122(), $payload['triggerMoveId']);
        self::assertSame('matrix-editor', $payload['matrix']['kind']);
        self::assertSame([1], $payload['matrix']['axes']['rowLayers']);
        self::assertSame([1], $payload['matrix']['axes']['columnLayers']);
    }

    public function testCreateScenarioPersistsAxisLayers(): void
    {
        [$defender, $attacker, $triggerMove] = $this->createScenarioActors();

        $this->client->request('POST', '/api/scenarios', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'name' => 'Layered Oki Test',
            'scenarioType' => 'oki',
            'defenderCharacterId' => $defender->getId()?->toRfc4122(),
            'attackerCharacterId' => $attacker->getId()?->toRfc4122(),
            'triggerMoveId' => $triggerMove->getId()?->toRfc4122(),
            'matrix' => $this->buildMatrixPayload([3], [5]),
        ]));

        self::assertSame(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode());
        $created = json_decode((string) $this->client->getResponse()->getContent(), true);

        self::assertSame([3], $created['matrix']['axes']['rowLayers']);
        self::assertSame([5], $created['matrix']['axes']['columnLayers']);
    }

    public function testListScenariosSupportsFilters(): void
    {
        [$defender, $attacker, $triggerMove] = $this->createScenarioActors();
        $scenario = $this->createScenario('Throw Loop Oki', 'oki', $defender, $attacker, $triggerMove);

        $this->client->request('GET', sprintf('/api/scenarios?q=throw&scenarioType=oki&defenderCharacterId=%s', $defender->getId()?->toRfc4122()));
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertCount(1, $payload);
        self::assertSame($scenario->getPublicId()->toRfc4122(), $payload[0]['id']);
    }

    public function testReadScenarioReturns404ForInvalidIdFormat(): void
    {
        $this->client->request('GET', '/api/scenarios/not-a-uuid', [], [], $this->getHeaders());

        self::assertSame(Response::HTTP_NOT_FOUND, $this->client->getResponse()->getStatusCode());
    }

    public function testReadScenarioReturns404ForUnknownId(): void
    {
        $this->client->request('GET', '/api/scenarios/' . Uuid::v7()->toRfc4122(), [], [], $this->getHeaders());

        self::assertSame(Response::HTTP_NOT_FOUND, $this->client->getResponse()->getStatusCode());
    }

    public function testCreateScenarioResolvesDynamicComboValue(): void
    {
        [$defender, $attacker, $triggerMove] = $this->createScenarioActors();
        $starterMove = $this->createMoveWithDamage($attacker, '2LK', 280);
        $this->createComboForStarter($attacker, $starterMove, 1450, false, false);

        $this->client->request('POST', '/api/scenarios', [], [], $this->getHeaders(), json_encode([
            'name' => 'Dynamic Combo Resolve',
            'scenarioType' => 'oki',
            'defenderCharacterId' => $defender->getId()?->toRfc4122(),
            'attackerCharacterId' => $attacker->getId()?->toRfc4122(),
            'triggerMoveId' => $triggerMove->getId()?->toRfc4122(),
            'matrix' => $this->buildDynamicMatrixPayload($attacker, $starterMove, 'normal'),
        ]));

        self::assertSame(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode());
        $created = json_decode((string) $this->client->getResponse()->getContent(), true);

        self::assertSame('dynamic_combo', $created['matrix']['cells'][0][0]['cellType']);
        self::assertSame('number', $created['matrix']['cells'][0][0]['dataType']);
        self::assertSame(1450, $created['matrix']['cells'][0][0]['value']);
    }

    public function testResolveDynamicCellsEndpointRefreshesScenarioValues(): void
    {
        [$defender, $attacker, $triggerMove] = $this->createScenarioActors();
        $starterMove = $this->createMoveWithDamage($attacker, '2LK', 260);

        $this->client->request('POST', '/api/scenarios', [], [], $this->getHeaders(), json_encode([
            'name' => 'Dynamic Combo Refresh',
            'scenarioType' => 'oki',
            'defenderCharacterId' => $defender->getId()?->toRfc4122(),
            'attackerCharacterId' => $attacker->getId()?->toRfc4122(),
            'triggerMoveId' => $triggerMove->getId()?->toRfc4122(),
            'matrix' => $this->buildDynamicMatrixPayload($attacker, $starterMove, 'normal'),
        ]));
        self::assertSame(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode());

        $created = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertSame(260, $created['matrix']['cells'][0][0]['value']);

        $this->createComboForStarter($attacker, $starterMove, 1700, false, false);

        $this->client->request(
            'POST',
            sprintf('/api/scenarios/%s/resolve-dynamic-cells', $created['id']),
            [],
            [],
            $this->getHeaders()
        );

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);

        self::assertSame(1, $payload['resolution']['totalDynamicCells']);
        self::assertSame(1, $payload['resolution']['resolvedCells']);
        self::assertSame(0, $payload['resolution']['unresolvedCells']);
        self::assertSame(1700, $payload['scenario']['matrix']['cells'][0][0]['value']);
    }

    public function testResolveDynamicCellPreviewEndpointReturnsBestComboDamage(): void
    {
        [, $attacker, ] = $this->createScenarioActors();
        $starterMove = $this->createMoveWithDamage($attacker, '2LP', 240);
        $this->createComboForStarter($attacker, $starterMove, 2000, false, false);

        $this->client->request(
            'POST',
            '/api/scenarios/resolve-dynamic-cell',
            [],
            [],
            array_merge($this->getHeaders(), ['CONTENT_TYPE' => 'application/json']),
            json_encode([
                'attackerCharacterId' => $attacker->getId()?->toRfc4122(),
                'starterMoveIds' => [$starterMove->getId()?->toRfc4122()],
                'starterContext' => [
                    'isPunishCounter' => false,
                    'isCounterHit' => false,
                ],
            ])
        );

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);

        self::assertSame(2000, $payload['resolvedDamage']);
        self::assertNotNull($payload['resolvedComboId']);
        self::assertSame($starterMove->getId()?->toRfc4122(), $payload['resolvedStarterMoveId']);
    }

    public function testResolveDynamicCellPreviewSupportsExecutionModes(): void
    {
        [, $attacker, ] = $this->createScenarioActors();
        $starterMove = $this->createMoveWithDamage($attacker, '2MK', 300);

        $easyCombo = $this->createComboForStarter($attacker, $starterMove, 1400, false, false, 2);
        $hardCombo = $this->createComboForStarter($attacker, $starterMove, 2100, false, false, 7);

        $this->client->request(
            'POST',
            '/api/scenarios/resolve-dynamic-cell',
            [],
            [],
            array_merge($this->getHeaders(), ['CONTENT_TYPE' => 'application/json']),
            json_encode([
                'attackerCharacterId' => $attacker->getId()?->toRfc4122(),
                'starterMoveIds' => [$starterMove->getId()?->toRfc4122()],
                'starterContext' => [
                    'isPunishCounter' => false,
                    'isCounterHit' => false,
                ],
                'executionMode' => [
                    'mode' => 'difficulty_cap',
                    'difficultyCap' => 3,
                ],
            ])
        );

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $difficultyPayload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertSame(1400, $difficultyPayload['resolvedDamage']);

        $user = $this->em->getRepository(User::class)->findOneBy(['username' => 'testuser']);
        self::assertNotNull($user);

        $this->em->persist((new UserCombo())
            ->setUser($user)
            ->setCharacter($attacker)
            ->setCombo($hardCombo)
            ->setKnown(true));
        $this->em->flush();

        $this->client->request(
            'POST',
            '/api/scenarios/resolve-dynamic-cell',
            [],
            [],
            array_merge($this->getHeaders(), ['CONTENT_TYPE' => 'application/json']),
            json_encode([
                'attackerCharacterId' => $attacker->getId()?->toRfc4122(),
                'starterMoveIds' => [$starterMove->getId()?->toRfc4122()],
                'starterContext' => [
                    'isPunishCounter' => false,
                    'isCounterHit' => false,
                ],
                'executionMode' => [
                    'mode' => 'my_knowledge',
                ],
            ])
        );

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $knowledgePayload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertSame(2100, $knowledgePayload['resolvedDamage']);
        self::assertSame($hardCombo->getId(), $knowledgePayload['resolvedComboId']);

        self::assertNotNull($easyCombo->getId());
    }

    public function testCreateAggregatedScenarioLocksDefensiveColumns(): void
    {
        [$defender, $attacker, $triggerMove] = $this->createScenarioActors();

        $payload = $this->buildMatrixPayload();
        $payload['axes']['columns'] = ['Custom Defense'];
        $payload['summary']['columnAxis'] = [
            ['cellType' => 'summary', 'dataType' => 'number', 'value' => 1],
        ];

        $this->client->request('POST', '/api/scenarios', [], [], $this->getHeaders(), json_encode([
            'name' => 'Aggregated Oki Scenario',
            'scenarioType' => 'aggregated_oki',
            'defenderCharacterId' => $defender->getId()?->toRfc4122(),
            'attackerCharacterId' => $attacker->getId()?->toRfc4122(),
            'triggerMoveId' => $triggerMove->getId()?->toRfc4122(),
            'matrix' => $payload,
        ]));

        self::assertSame(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode());
        $created = json_decode((string) $this->client->getResponse()->getContent(), true);

        self::assertSame('aggregated_oki', $created['scenarioType']);
        self::assertSame('Aggregated Oki', $created['typeLabel']);
        self::assertSame([
            'Block',
            'Mash 4f',
            'Invincible Reversal Fast',
            'Invincible Reversal Slow',
            'Invincible Super',
            'Backdash',
            'Delay Tech',
            'Perfect Parry',
            'No Invincible Option',
        ], $created['matrix']['axes']['columns']);
        self::assertCount(9, $created['matrix']['summary']['columnAxis']);
        self::assertCount(9, $created['matrix']['cells'][0]);
    }

    public function testAggregatedDefenseCapabilitiesEndpointSupportsCharacterMapping(): void
    {
        $ed = (new Character())->setName('Ed');
        $this->em->persist($ed);
        $this->em->flush();

        $this->client->request('GET', '/api/scenarios/aggregated-defense-capabilities', [], [], $this->getHeaders());
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $genericPayload = json_decode((string) $this->client->getResponse()->getContent(), true);

        self::assertCount(9, $genericPayload['catalog']);
        self::assertTrue($genericPayload['capabilities']['invincible_reversal_fast']);

        $this->client->request(
            'GET',
            sprintf('/api/scenarios/aggregated-defense-capabilities?characterId=%s', $ed->getId()?->toRfc4122()),
            [],
            [],
            $this->getHeaders()
        );
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $edPayload = json_decode((string) $this->client->getResponse()->getContent(), true);

        self::assertSame($ed->getId()?->toRfc4122(), $edPayload['characterId']);
        self::assertFalse($edPayload['capabilities']['invincible_reversal_fast']);
        self::assertTrue($edPayload['capabilities']['invincible_reversal_slow']);
    }

    /**
     * @return array{Character, Character, Move}
     */
    private function createScenarioActors(): array
    {
        $defender = (new Character())->setName('Ryu');
        $attacker = (new Character())->setName('Cammy');
        $triggerMove = (new Move())->setCharacter($attacker)->setNumpadNotation('2HP');

        $this->em->persist($defender);
        $this->em->persist($attacker);
        $this->em->persist($triggerMove);
        $this->em->flush();

        return [$defender, $attacker, $triggerMove];
    }

    private function createScenario(
        string $name,
        string $scenarioType,
        Character $defender,
        Character $attacker,
        Move $triggerMove,
    ): Scenario {
        $scenario = (new Scenario())
            ->setName($name)
            ->setScenarioType($scenarioType)
            ->setDefenderCharacter($defender)
            ->setAttackerCharacter($attacker)
            ->setTriggerMove($triggerMove);

        $scenarioRow = (new \App\Entity\ScenarioRow())
            ->setScenario($scenario)
            ->setPosition(0)
            ->setLabel('Defend')
            ->setSummaryValue(0.5);

        $scenarioColumn = (new \App\Entity\ScenarioColumn())
            ->setScenario($scenario)
            ->setPosition(0)
            ->setLabel('Meaty')
            ->setSummaryValue(0.5);

        $scenarioCell = (new \App\Entity\ScenarioCell())
            ->setScenario($scenario)
            ->setRow($scenarioRow)
            ->setColumn($scenarioColumn)
            ->setKind(\App\Entity\ScenarioCell::KIND_STATIC)
            ->setStaticValue(20.0);

        $scenario->addRow($scenarioRow);
        $scenario->addColumn($scenarioColumn);
        $scenario->addCell($scenarioCell);

        $this->em->persist($scenario);
        $this->em->flush();

        return $scenario;
    }

    private function createMoveWithDamage(Character $character, string $notation, int $damage): Move
    {
        $move = (new Move())
            ->setCharacter($character)
            ->setNumpadNotation($notation);
        $this->em->persist($move);

        $frameData = (new FrameData())
            ->setMoveType('normal')
            ->setDamage($damage);
        $move->setFrameData($frameData);
        $this->em->persist($frameData);

        $this->em->flush();

        return $move;
    }

    private function createComboForStarter(
        Character $character,
        Move $starterMove,
        int $damage,
        bool $counterHit,
        bool $punishCounter,
        ?int $difficultyLevel = null,
    ): ComboSequences
    {
        $leafType = $this->em->getRepository(ComboSequenceType::class)->findOneBy(['name' => 'leaf'])
            ?? (new ComboSequenceType())->setName('leaf');
        $comboType = $this->em->getRepository(ComboSequenceType::class)->findOneBy(['name' => 'combo'])
            ?? (new ComboSequenceType())->setName('combo');
        $visibility = $this->em->getRepository(Visibility::class)->findOneBy(['name' => 'public'])
            ?? (new Visibility())->setName('public');
        $connectionType = $this->em->getRepository(ConnectionType::class)->findOneBy(['name' => 'Initial Move'])
            ?? (new ConnectionType())->setName('Initial Move');

        $this->em->persist($leafType);
        $this->em->persist($comboType);
        $this->em->persist($visibility);
        $this->em->persist($connectionType);

        $leaf = $this->em->getRepository(ComboSequences::class)->findOneBy([
            'move' => $starterMove,
            'type' => $leafType,
        ]);
        if (!$leaf instanceof ComboSequences) {
            $leaf = new ComboSequences();
            $leaf->setName(sprintf('%s %s', $character->getName(), $starterMove->getNumpadNotation()))
                ->setDescription('leaf')
                ->setType($leafType)
                ->setVisibility($visibility)
                ->setMove($starterMove);
            $this->em->persist($leaf);
        }

        $combo = new ComboSequences();
        $combo->setName(sprintf('Combo %d', $damage))
            ->setDescription('combo')
            ->setType($comboType)
            ->setVisibility($visibility);
        $this->em->persist($combo);

        $metrics = (new ComboMetrics())
            ->setSequence($combo)
            ->setDamage($damage)
            ->setDifficultyLevel($difficultyLevel);
        $this->em->persist($metrics);

        $step = (new Step())
            ->setParentSequence($combo)
            ->setChildSequence($leaf)
            ->setOrdinalInCombo(1)
            ->setConnectionType($connectionType);
        $this->em->persist($step);

        $requirement = (new ComboRequirement())
            ->setSequence($combo)
            ->setCounterHitRequired($counterHit)
            ->setPunishCounterRequired($punishCounter)
            ->setCornerRequired(false)
            ->setAirborneRequired(false)
            ->setMidScreenRequired(false)
            ->setNotCrouchingRequired(false);
        $this->em->persist($requirement);

        $this->em->flush();

        return $combo;
    }

    /**
     * @return array<string, mixed>
     */
    private function buildMatrixPayload(array $rowLayers = [1], array $columnLayers = [1]): array
    {
        return [
            'kind' => 'matrix-editor',
            'schemaVersion' => 1,
            'axes' => [
                'rows' => ['Defend'],
                'columns' => ['Meaty'],
                'rowLayers' => $rowLayers,
                'columnLayers' => $columnLayers,
            ],
            'cells' => [[[
                'cellType' => 'value',
                'dataType' => 'number',
                'value' => 20,
            ]]],
            'summary' => [
                'rowAxis' => [[
                    'cellType' => 'summary',
                    'dataType' => 'number',
                    'value' => 0.5,
                ]],
                'columnAxis' => [[
                    'cellType' => 'summary',
                    'dataType' => 'number',
                    'value' => 0.5,
                ]],
                'expectedValue' => [
                    'cellType' => 'summary',
                    'dataType' => 'empty',
                    'value' => null,
                ],
            ],
            'metadata' => [
                'matrixId' => 'mx_controller_test',
                'title' => 'Corner Oki Test',
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function buildDynamicMatrixPayload(Character $attacker, Move $starterMove, string $starterContext): array
    {
        return [
            'kind' => 'matrix-editor',
            'schemaVersion' => 1,
            'axes' => [
                'rows' => ['Defend'],
                'columns' => ['Meaty'],
            ],
            'cells' => [[[
                'cellType' => 'dynamic_combo',
                'dataType' => 'empty',
                'value' => null,
                'dynamicCombo' => [
                    'attackerCharacterId' => $attacker->getId()?->toRfc4122(),
                    'starterMoveIds' => [$starterMove->getId()?->toRfc4122()],
                    'starterContext' => [
                        'isPunishCounter' => 'punish_counter' === $starterContext,
                        'isCounterHit' => 'counter_hit' === $starterContext,
                    ],
                ],
            ]]],
            'summary' => [
                'rowAxis' => [[
                    'cellType' => 'summary',
                    'dataType' => 'number',
                    'value' => 0.5,
                ]],
                'columnAxis' => [[
                    'cellType' => 'summary',
                    'dataType' => 'number',
                    'value' => 0.5,
                ]],
                'expectedValue' => [
                    'cellType' => 'summary',
                    'dataType' => 'empty',
                    'value' => null,
                ],
            ],
            'metadata' => [
                'matrixId' => 'mx_dynamic_controller_test',
                'title' => 'Dynamic Matrix Test',
            ],
        ];
    }
}
