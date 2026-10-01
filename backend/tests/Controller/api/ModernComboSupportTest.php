<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\CharacterModernAutoCombo;
use App\Entity\ComboSequences;
use App\Entity\ComboSequenceType;
use App\Entity\ConnectionType;
use App\Entity\FrameData;
use App\Entity\Move;
use App\Entity\User;
use App\Entity\Visibility;
use App\Service\ComboSequenceCreationService;
use App\Service\Modern\ModernComboRevalidationService;
use App\Tests\DatabaseTestCase;
use App\Util\Enum\ModernAutoComboStrength;
use App\Util\Enum\UserRole;
use Symfony\Component\HttpFoundation\Response;

final class ModernComboSupportTest extends DatabaseTestCase
{
    private Character $character;
    private ConnectionType $connection;
    /** @var array<string, ComboSequences> */
    private array $leafs = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalog();
    }

    public function testCreationStoresLegalityAndDamagePerExecutionMode(): void
    {
        $combo = $this->createCombo(['5MP', '236HP'], 1500);
        $metrics = $combo->getComboMetrics();

        self::assertTrue($combo->isModernLegal());
        self::assertNotNull($metrics);
        self::assertSame(1500, $metrics->getDamage());
        self::assertSame(1500, $metrics->getModernMaxDamage(), 'Max damage uses the motion input: no penalty.');
        self::assertSame(1260, $metrics->getModernSimpleDamage(), '236HP by simple input deals 80% of its 1200 base: 1500 - 1200 + 960.');
    }

    public function testDamageEnteredInAModernModeIsConvertedBackToClassic(): void
    {
        $metrics = $this->createCombo(['5MP', '236HP'], 1260, 'modern_simple')->getComboMetrics();

        self::assertNotNull($metrics);
        self::assertSame(1500, $metrics->getDamage());
        self::assertSame(1260, $metrics->getModernSimpleDamage());
    }

    public function testAMoveModernLacksMakesTheComboIllegalWithoutModernDamage(): void
    {
        $combo = $this->createCombo(['5LK', '236HP'], 1400);
        $metrics = $combo->getComboMetrics();

        self::assertFalse($combo->isModernLegal());
        self::assertNotNull($metrics);
        self::assertNull($metrics->getModernMaxDamage());
        self::assertNull($metrics->getModernSimpleDamage());
    }

    public function testSearchInAModernModeFiltersIllegalCombosAndUsesThatModesDamageAndNotation(): void
    {
        $legal = $this->createCombo(['5MP', '236HP'], 1500);
        $this->createCombo(['5LK', '236HP'], 1400);
        $characterId = (string) $this->character->getId();
        $this->loginHeaders($this->createUser('classic_player', []));

        $classic = $this->search(['characterId' => $characterId, 'sort' => 'damage']);
        $simple = $this->search(['characterId' => $characterId, 'sort' => 'damage', 'executionMode' => 'modern_simple']);
        $filtered = $this->search(['characterId' => $characterId, 'executionMode' => 'modern_simple', 'minDamage' => 1300]);

        self::assertCount(2, $classic);
        self::assertSame([$legal->getId()], array_column($simple, 'id'));
        self::assertSame(1260, $simple[0]['comboMetrics']['damage']);
        self::assertSame('modern_simple', $simple[0]['executionMode']);
        self::assertSame('M > 6SP', $simple[0]['executionNotation']);
        self::assertSame(['M', '6SP'], array_column($simple[0]['steps'], 'child_sequence_notation'));
        self::assertArrayNotHasKey('modernSimpleDamage', $simple[0]['comboMetrics'], 'Only the active mode damage is exposed.');
        self::assertSame([], $filtered, 'The damage filter compares the Modern simple damage (1260), not Classic (1500).');
    }

    public function testTheProfileExecutionModeIsTheSearchDefaultAndCanBeOverridden(): void
    {
        $legal = $this->createCombo(['5MP', '236HP'], 1500);
        $this->createCombo(['5LK', '236HP'], 1400);
        $headers = $this->loginHeaders($this->createUser('modern_player', []));

        $this->client->request('PUT', '/api/profile/combo-execution-mode', [], [], $headers, json_encode(['comboExecutionMode' => 'modern_max']));
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $this->client->request('GET', '/api/profile/combo-execution-mode', [], [], $headers);
        self::assertSame(['comboExecutionMode' => 'modern_max'], $this->json());

        $byDefault = $this->search(['characterId' => (string) $this->character->getId()]);
        $overridden = $this->search(['characterId' => (string) $this->character->getId(), 'executionMode' => 'classic']);

        self::assertSame([$legal->getId()], array_column($byDefault, 'id'));
        self::assertSame('modern_max', $byDefault[0]['executionMode']);
        self::assertCount(2, $overridden);

        $this->client->request('PUT', '/api/profile/combo-execution-mode', [], [], $headers, json_encode(['comboExecutionMode' => 'dynamic']));
        self::assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());
    }

    public function testModeratorEditsRevalidateStoredLegality(): void
    {
        $combo = $this->createCombo(['5MP', '236HP'], 1500);
        $headers = $this->loginHeaders($this->createUser('moderator_user', [UserRole::MODERATOR]));
        $moveId = $this->leafs['5MP']->getMove()?->getId()?->toRfc4122();

        $this->client->request('PATCH', sprintf('/api/moderation/frame-data/modern/%s', $moveId), [], [], $headers, json_encode([
            'availableOnModern' => false,
            'modernMaxNotation' => null,
            'modernSimpleNotation' => null,
            'modernSimpleDamagePercent' => null,
        ]));

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        self::assertFalse($this->json()['modern']['availableOnModern']);
        self::assertFalse($this->reload($combo)->isModernLegal());

        $this->client->request('PATCH', sprintf('/api/moderation/frame-data/modern/%s', $moveId), [], [], $headers, json_encode(['availableOnModern' => true, 'modernSimpleDamagePercent' => 120]));
        self::assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());
    }

    public function testAnAutoComboMakesItsOtherwiseUnavailableMovesReachable(): void
    {
        $autoCombo = $this->createCombo(['5MP', '5LK'], 900);
        $route = $this->createCombo(['2MK', '5MP', '5LK'], 1300);
        $brokenRoute = $this->createCombo(['2MK', '5LK'], 1000);
        self::assertFalse($route->isModernLegal());
        $headers = $this->loginHeaders($this->createUser('moderator_user', [UserRole::MODERATOR]));

        $this->client->request('PUT', sprintf('/api/moderation/frame-data/characters/%s/modern-auto-combos/medium', $this->character->getId()), [], [], $headers, json_encode(['comboId' => $autoCombo->getId()]));

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        self::assertSame(['comboId' => $autoCombo->getId(), 'name' => 'combo'], $this->json()['autoCombos']['medium']);
        self::assertNull($this->json()['autoCombos']['light']);
        self::assertTrue($this->reload($route)->isModernLegal());
        self::assertFalse($this->reload($brokenRoute)->isModernLegal(), '5LK is only reachable right after the auto combo 5MP.');
        self::assertNotNull($this->entityManager->getRepository(CharacterModernAutoCombo::class)->findOneBy(['strength' => ModernAutoComboStrength::MEDIUM]));
    }

    public function testRevalidationCommandRecomputesStaleRows(): void
    {
        $combo = $this->createCombo(['5MP', '236HP'], 1500);
        $this->entityManager->getConnection()->executeStatement('UPDATE sf6.combo_sequence SET modern_legal = FALSE');
        $this->entityManager->getConnection()->executeStatement('UPDATE sf6.combo_metrics SET modern_simple_damage = NULL');
        $this->entityManager->clear();

        $this->client->getContainer()->get(ModernComboRevalidationService::class)->revalidate();

        $reloaded = $this->reload($combo);
        self::assertTrue($reloaded->isModernLegal());
        self::assertSame(1260, $reloaded->getComboMetrics()?->getModernSimpleDamage());
    }

    public function testTranslationAcceptsModernInputAndRendersInTheRequestedMode(): void
    {
        $headers = $this->loginHeaders($this->createUser('modern_player', []));
        $this->client->request('POST', '/api/combo-sequences/translate', [], [], $headers, json_encode([
            'characterId' => (string) $this->character->getId(),
            'notation' => 'M xx 236HP',
            'executionMode' => 'modern_simple',
        ]));

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $payload = $this->json();
        self::assertSame([], $payload['errors']);
        self::assertSame([$this->leafs['5MP']->getId(), $this->leafs['236HP']->getId()], array_column($payload['steps'], 'child_sequence_id'));
        self::assertSame('M > 6SP', $payload['executionNotation']);
    }

    /** @param list<string> $notations */
    private function createCombo(array $notations, int $damage, ?string $damageExecutionMode = null): ComboSequences
    {
        $steps = [];
        foreach ($notations as $index => $notation) {
            $steps[] = ['child_sequence_id' => $this->leafs[$notation]->getId(), 'ordinal_in_combo' => $index + 1, 'connection_type_id' => $this->connection->getId()];
        }
        $metrics = ['damage' => $damage] + (null === $damageExecutionMode ? [] : ['damageExecutionMode' => $damageExecutionMode]);

        return $this->client->getContainer()->get(ComboSequenceCreationService::class)
            ->createFromPayload(['name' => 'combo', 'description' => '', 'visibility' => 'public', 'metrics' => $metrics], 'combo', $steps);
    }

    private function seedCatalog(): void
    {
        $this->character = (new Character())->setName('Ryu');
        $this->connection = (new ConnectionType())->setName('Link');
        $leafType = (new ComboSequenceType())->setName('leaf');
        $visibility = (new Visibility())->setName('public');
        foreach ([$this->character, $this->connection, $leafType, $visibility, (new ComboSequenceType())->setName('combo')] as $entity) {
            $this->entityManager->persist($entity);
        }

        foreach ([
            ['2MK', 'normal', 500, true, '2M', null, null],
            ['5MP', 'normal', 600, true, 'M', null, null],
            ['5LK', 'normal', 300, false, null, null, null],
            ['236HP', 'special', 1200, true, '236H', '6SP', 80],
        ] as [$notation, $moveType, $damage, $available, $max, $simple, $percent]) {
            $frameData = (new FrameData())->setMoveType($moveType)->setDamage($damage);
            $move = (new Move())
                ->setCharacter($this->character)
                ->setNumpadNotation($notation)
                ->setAvailableOnModern($available)
                ->setModernMaxNotation($max)
                ->setModernSimpleNotation($simple)
                ->setModernSimpleDamagePercent($percent);
            $move->setFrameData($frameData);
            $leaf = (new ComboSequences())->setName('Ryu - ' . $notation)->setDescription('leaf')->setMove($move)->setType($leafType)->setVisibility($visibility);
            $this->entityManager->persist($frameData);
            $this->entityManager->persist($move);
            $this->entityManager->persist($leaf);
            $this->leafs[$notation] = $leaf;
        }
        $this->entityManager->flush();
    }

    /**
     * @param array<string, mixed> $query
     *
     * @return list<array<string, mixed>>
     */
    private function search(array $query): array
    {
        $this->client->request('GET', '/api/combo-sequences', $query);
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());

        return $this->json();
    }

    private function reload(ComboSequences $combo): ComboSequences
    {
        $this->entityManager->clear();
        $reloaded = $this->entityManager->getRepository(ComboSequences::class)->find($combo->getId());
        self::assertInstanceOf(ComboSequences::class, $reloaded);

        return $reloaded;
    }

    /** @return array<mixed> */
    private function json(): array
    {
        return json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
    }

    /** @param list<UserRole> $roles */
    private function createUser(string $username, array $roles): User
    {
        $user = (new User())
            ->setUsername($username)
            ->setPassword(self::hashTestPassword())
            ->setRoles(array_map(static fn (UserRole $role): string => $role->value, $roles))
            ->setIsActive(true);
        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    /** @return array<string, string> */
    private function loginHeaders(User $user): array
    {
        $this->client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode(['username' => $user->getUsername(), 'password' => 'testpassword']));
        $payload = $this->json();

        return ['HTTP_X_CSRF_TOKEN' => (string) ($payload['csrfToken'] ?? ''), 'CONTENT_TYPE' => 'application/json'];
    }
}
