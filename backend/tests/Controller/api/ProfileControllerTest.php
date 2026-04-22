<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\ComboMetrics;
use App\Entity\ComboSequences;
use App\Entity\ComboSequenceType;
use App\Entity\ConnectionType;
use App\Entity\Move;
use App\Entity\Scenario;
use App\Entity\ScenarioCell;
use App\Entity\ScenarioColumn;
use App\Entity\ScenarioRow;
use App\Entity\Step;
use App\Entity\User;
use App\Entity\UserCombo;
use App\Entity\Visibility;
use App\Tests\Controller\AuthenticatedWebTestCase;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Response;

class ProfileControllerTest extends AuthenticatedWebTestCase
{
    private EntityManagerInterface $em;

    public function setUp(): void
    {
        parent::setUp();
        $this->em = static::getContainer()->get(EntityManagerInterface::class);
    }

    public function testGetExecutionPreferenceReturnsStandardDefaults(): void
    {
        $this->client->request('GET', '/api/profile/execution-preference', [], [], $this->getHeaders());

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);

        self::assertSame('standard', $payload['defaultMode']);
        self::assertNull($payload['difficultyCap']);
    }

    public function testUpdateExecutionPreferencePersistsDifficultyCap(): void
    {
        $this->client->request(
            'PUT',
            '/api/profile/execution-preference',
            [],
            [],
            $this->getHeaders(),
            json_encode([
                'defaultMode' => 'difficulty_cap',
                'difficultyCap' => 4,
            ])
        );

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);

        self::assertSame('difficulty_cap', $payload['defaultMode']);
        self::assertSame(4, $payload['difficultyCap']);

        $this->client->request('GET', '/api/profile/execution-preference', [], [], $this->getHeaders());
        $fetched = json_decode((string) $this->client->getResponse()->getContent(), true);

        self::assertSame('difficulty_cap', $fetched['defaultMode']);
        self::assertSame(4, $fetched['difficultyCap']);
    }

    public function testUpdateComboKnowledgeStoresKnownComboIdsForCharacter(): void
    {
        [$character, $comboOne, $comboTwo] = $this->seedCharacterCombos();

        $this->client->request(
            'POST',
            '/api/login_check',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'username' => 'testuser',
                'password' => 'testpassword',
            ])
        );
        $loginPayload = json_decode((string) $this->client->getResponse()->getContent(), true);
        $authHeaders = [
            'HTTP_AUTHORIZATION' => sprintf('Bearer %s', (string) ($loginPayload['token'] ?? '')),
            'CONTENT_TYPE' => 'application/json',
        ];

        $this->client->request(
            'PUT',
            '/api/profile/combo-knowledge',
            [],
            [],
            $authHeaders,
            json_encode([
                'characterId' => $character->getId()?->toRfc4122(),
                'knownComboIds' => [$comboTwo->getId()],
            ])
        );

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        $this->client->request(
            'GET',
            sprintf('/api/profile/combo-knowledge?characterId=%s', $character->getId()?->toRfc4122()),
            [],
            [],
            ['HTTP_AUTHORIZATION' => $authHeaders['HTTP_AUTHORIZATION']]
        );

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);

        self::assertCount(2, $payload['combos']);
        $byId = [];
        foreach ($payload['combos'] as $comboRow) {
            $byId[(int) $comboRow['id']] = $comboRow;
        }

        self::assertFalse($byId[$comboOne->getId()]['known']);
        self::assertTrue($byId[$comboTwo->getId()]['known']);
    }

    public function testGetComboRecommendationsReturnsTopEssentialUnknownCombosByEvGain(): void
    {
        $fixture = $this->seedRecommendationFixtures();

        $this->client->request(
            'GET',
            sprintf(
                '/api/profile/combo-recommendations?characterId=%s&difficultyCap=5',
                $fixture['character']->getId()?->toRfc4122()
            ),
            [],
            [],
            $this->getHeaders()
        );

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);

        self::assertSame(1, $payload['essentialScenarioCount']);
        self::assertCount(2, $payload['recommendations']);

        self::assertSame($fixture['candidateHigh']->getId(), $payload['recommendations'][0]['comboId']);
        self::assertSame(80.0, (float) $payload['recommendations'][0]['averageEvGainPerScenario']);

        self::assertSame($fixture['candidateLow']->getId(), $payload['recommendations'][1]['comboId']);
        self::assertSame(60.0, (float) $payload['recommendations'][1]['averageEvGainPerScenario']);
    }

    public function testGetComboRecommendationsReturnsEmptyWhenNoCandidatesRemain(): void
    {
        $fixture = $this->seedRecommendationFixtures();

        $user = $this->em->getRepository(User::class)->findOneBy(['username' => 'testuser']);
        self::assertNotNull($user);

        foreach ([$fixture['candidateLow'], $fixture['candidateHigh']] as $combo) {
            $this->em->persist(
                (new UserCombo())
                    ->setUser($user)
                    ->setCharacter($fixture['character'])
                    ->setCombo($combo)
                    ->setKnown(true)
            );
        }
        $this->em->flush();

        $this->client->request(
            'GET',
            sprintf(
                '/api/profile/combo-recommendations?characterId=%s&difficultyCap=5',
                $fixture['character']->getId()?->toRfc4122()
            ),
            [],
            [],
            $this->getHeaders()
        );

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);

        self::assertSame(1, $payload['essentialScenarioCount']);
        self::assertSame([], $payload['recommendations']);
    }

    /**
     * @return array{Character, ComboSequences, ComboSequences}
     */
    private function seedCharacterCombos(): array
    {
        $character = (new Character())->setName('Juri');
        $this->em->persist($character);

        $leafType = (new ComboSequenceType())->setName('leaf');
        $comboType = (new ComboSequenceType())->setName('combo');
        $visibility = (new Visibility())->setName('public');
        $connectionType = (new ConnectionType())->setName('Initial Move');

        $this->em->persist($leafType);
        $this->em->persist($comboType);
        $this->em->persist($visibility);
        $this->em->persist($connectionType);

        $starterMove = (new Move())
            ->setCharacter($character)
            ->setNumpadNotation('5MP');
        $this->em->persist($starterMove);

        $starterLeaf = (new ComboSequences())
            ->setName('Juri 5MP')
            ->setDescription('leaf')
            ->setType($leafType)
            ->setVisibility($visibility)
            ->setMove($starterMove);
        $this->em->persist($starterLeaf);

        $comboOne = (new ComboSequences())
            ->setName('Juri Easy Route')
            ->setDescription('combo')
            ->setType($comboType)
            ->setVisibility($visibility);
        $this->em->persist($comboOne);

        $comboTwo = (new ComboSequences())
            ->setName('Juri Medium Route')
            ->setDescription('combo')
            ->setType($comboType)
            ->setVisibility($visibility);
        $this->em->persist($comboTwo);

        $this->em->persist((new ComboMetrics())->setSequence($comboOne)->setDamage(1200)->setDifficultyLevel(2));
        $this->em->persist((new ComboMetrics())->setSequence($comboTwo)->setDamage(1700)->setDifficultyLevel(4));

        $this->em->persist((new Step())->setParentSequence($comboOne)->setChildSequence($starterLeaf)->setOrdinalInCombo(1)->setConnectionType($connectionType));
        $this->em->persist((new Step())->setParentSequence($comboTwo)->setChildSequence($starterLeaf)->setOrdinalInCombo(1)->setConnectionType($connectionType));

        $this->em->flush();

        return [$character, $comboOne, $comboTwo];
    }

    /**
     * @return array{
     *     character: Character,
     *     candidateLow: ComboSequences,
     *     candidateHigh: ComboSequences
     * }
     */
    private function seedRecommendationFixtures(): array
    {
        $character = (new Character())->setName('Cammy');
        $opponent = (new Character())->setName('Luke');
        $this->em->persist($character);
        $this->em->persist($opponent);

        $leafType = (new ComboSequenceType())->setName('leaf');
        $comboType = (new ComboSequenceType())->setName('combo');
        $visibility = (new Visibility())->setName('public');
        $connectionType = (new ConnectionType())->setName('Initial Move');

        $this->em->persist($leafType);
        $this->em->persist($comboType);
        $this->em->persist($visibility);
        $this->em->persist($connectionType);

        $starterMove = (new Move())
            ->setCharacter($character)
            ->setNumpadNotation('2MK');
        $triggerMove = (new Move())
            ->setCharacter($opponent)
            ->setNumpadNotation('5MP');

        $this->em->persist($starterMove);
        $this->em->persist($triggerMove);

        $starterLeaf = (new ComboSequences())
            ->setName('Cammy 2MK')
            ->setDescription('leaf')
            ->setType($leafType)
            ->setVisibility($visibility)
            ->setMove($starterMove);
        $this->em->persist($starterLeaf);

        $knownCombo = (new ComboSequences())
            ->setName('Cammy Baseline')
            ->setDescription('combo')
            ->setType($comboType)
            ->setVisibility($visibility)
            ->setIsEssential(true);
        $this->em->persist($knownCombo);
        $this->em->persist((new ComboMetrics())->setSequence($knownCombo)->setDamage(100)->setDifficultyLevel(1));
        $this->em->persist((new Step())->setParentSequence($knownCombo)->setChildSequence($starterLeaf)->setOrdinalInCombo(1)->setConnectionType($connectionType));

        $candidateLow = (new ComboSequences())
            ->setName('Cammy Essential 160')
            ->setDescription('combo')
            ->setType($comboType)
            ->setVisibility($visibility)
            ->setIsEssential(true);
        $this->em->persist($candidateLow);
        $this->em->persist((new ComboMetrics())->setSequence($candidateLow)->setDamage(160)->setDifficultyLevel(2));
        $this->em->persist((new Step())->setParentSequence($candidateLow)->setChildSequence($starterLeaf)->setOrdinalInCombo(1)->setConnectionType($connectionType));

        $candidateHigh = (new ComboSequences())
            ->setName('Cammy Essential 180')
            ->setDescription('combo')
            ->setType($comboType)
            ->setVisibility($visibility)
            ->setIsEssential(true);
        $this->em->persist($candidateHigh);
        $this->em->persist((new ComboMetrics())->setSequence($candidateHigh)->setDamage(180)->setDifficultyLevel(4));
        $this->em->persist((new Step())->setParentSequence($candidateHigh)->setChildSequence($starterLeaf)->setOrdinalInCombo(1)->setConnectionType($connectionType));

        $nonEssentialCombo = (new ComboSequences())
            ->setName('Cammy Non Essential 260')
            ->setDescription('combo')
            ->setType($comboType)
            ->setVisibility($visibility)
            ->setIsEssential(false);
        $this->em->persist($nonEssentialCombo);
        $this->em->persist((new ComboMetrics())->setSequence($nonEssentialCombo)->setDamage(260)->setDifficultyLevel(2));
        $this->em->persist((new Step())->setParentSequence($nonEssentialCombo)->setChildSequence($starterLeaf)->setOrdinalInCombo(1)->setConnectionType($connectionType));

        $scenario = (new Scenario())
            ->setName('Essential Training Scenario')
            ->setScenarioType('oki')
            ->setDefenderCharacter($character)
            ->setAttackerCharacter($character)
            ->setTriggerMove($triggerMove)
            ->setIsEssential(true);
        $this->em->persist($scenario);

        $nonEssentialScenario = (new Scenario())
            ->setName('Ignored Scenario')
            ->setScenarioType('oki')
            ->setDefenderCharacter($character)
            ->setAttackerCharacter($character)
            ->setTriggerMove($triggerMove)
            ->setIsEssential(false);
        $this->em->persist($nonEssentialScenario);

        foreach ([$scenario, $nonEssentialScenario] as $currentScenario) {
            $row = (new ScenarioRow())
                ->setScenario($currentScenario)
                ->setPosition(0)
                ->setLabel('Defender Action')
                ->setLayer(1)
                ->setSummaryValue(1.0);
            $column = (new ScenarioColumn())
                ->setScenario($currentScenario)
                ->setPosition(0)
                ->setLabel('Attacker Action')
                ->setLayer(1)
                ->setSummaryValue(1.0);

            $currentScenario->addRow($row);
            $currentScenario->addColumn($column);

            $cell = (new ScenarioCell())
                ->setScenario($currentScenario)
                ->setRow($row)
                ->setColumn($column)
                ->setKind(ScenarioCell::KIND_DYNAMIC_COMBO)
                ->setStarterContext('normal')
                ->setCachedValue(null)
                ->addStarterMove($starterMove);

            $currentScenario->addCell($cell);
            $this->em->persist($cell);
        }

        $this->em->flush();

        $user = $this->em->getRepository(User::class)->findOneBy(['username' => 'testuser']);
        self::assertNotNull($user);

        $this->em->persist(
            (new UserCombo())
                ->setUser($user)
                ->setCharacter($character)
                ->setCombo($knownCombo)
                ->setKnown(true)
        );
        $this->em->flush();

        return [
            'character' => $character,
            'candidateLow' => $candidateLow,
            'candidateHigh' => $candidateHigh,
        ];
    }
}
