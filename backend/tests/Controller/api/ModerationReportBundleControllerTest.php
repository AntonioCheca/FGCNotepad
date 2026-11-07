<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\CharacterObject;
use App\Entity\ComboSequences;
use App\Entity\ComboSequenceType;
use App\Entity\ConnectionType;
use App\Entity\FrameData;
use App\Entity\Move;
use App\Entity\Scenario;
use App\Entity\ScenarioResourceGrid;
use App\Entity\User;
use App\Entity\Visibility;
use App\Service\ReportBundle\ReportBundleService;
use App\Service\ScenarioAliasService;
use App\Service\ScenarioResourceGridService;
use App\Tests\DatabaseTestCase;
use App\Util\Enum\ModerationState;
use App\Util\Enum\UserRole;
use Symfony\Component\HttpFoundation\Response;

final class ModerationReportBundleControllerTest extends DatabaseTestCase
{
    private const DRY_RUN = '/api/moderation/report-bundles/dry-run';
    private const IMPORT = '/api/moderation/report-bundles';

    protected function setUp(): void
    {
        parent::setUp();
        $this->persistCatalog();
    }

    public function testDryRunReportsTheWholeImportAndWritesNothing(): void
    {
        $result = $this->post(self::DRY_RUN, $this->moderatorHeaders(), $this->bundle());

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        self::assertSame('ok', $result['status']);
        self::assertTrue($result['dryRun']);
        self::assertFalse($result['imported']);
        self::assertSame(['created' => 3, 'existing' => 0, 'approvedExisting' => 0], $result['combos']);
        self::assertSame([['name' => 'Juri 2HK oki vs Ken', 'action' => 'create']], $result['scenarios']);
        self::assertSame(0, $this->reportComboCount());
        self::assertSame(0, $this->entityManager->getRepository(Scenario::class)->count([]));
    }

    public function testImportApprovesEverythingAsTheModeratorAndReimportChangesNothing(): void
    {
        $moderator = $this->createUser([UserRole::MODERATOR]);
        $headers = $this->loginHeaders($moderator->getUsername());

        $result = $this->post(self::IMPORT, $headers, $this->bundle());

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), json_encode($result, JSON_THROW_ON_ERROR));
        self::assertTrue($result['imported']);
        $this->entityManager->clear();
        $combos = $this->reportCombos();
        self::assertCount(3, $combos);
        foreach ($combos as $combo) {
            self::assertSame(ModerationState::APPROVED->value, $combo->getModerationState());
            self::assertSame($moderator->getUsername(), $combo->getModerationDecidedBy()?->getUsername());
        }
        $scenario = $this->entityManager->getRepository(Scenario::class)->findOneBy([]);
        self::assertSame(ModerationState::APPROVED->value, $scenario?->getModerationState());

        $fuhaCombo = $this->entityManager->getRepository(ComboSequences::class)->findOneBy(['name' => 'PC: 5HP > 236HK']);
        self::assertSame(2500, $fuhaCombo?->getComboMetrics()?->getDamage());
        self::assertSame('juri_fuha', $fuhaCombo->getComboRequirement()?->getCharacterObjectStates()->first()->getObjectKey());

        $again = $this->post(self::IMPORT, $headers, $this->bundle());
        self::assertSame(['created' => 0, 'existing' => 3, 'approvedExisting' => 0], $again['combos']);
        self::assertSame('unchanged', $again['scenarios'][0]['action']);
        self::assertSame(3, $this->reportComboCount());
    }

    public function testAComboWaitingInTheQueueIsApprovedInsteadOfDuplicated(): void
    {
        $headers = $this->moderatorHeaders();
        $bundle = $this->bundle();
        $this->post(self::IMPORT, $headers, $bundle);
        $pending = $this->entityManager->getRepository(ComboSequences::class)->findOneBy(['name' => 'CH: 2MK > 5HP']);
        $pending?->setModerationState(ModerationState::PENDING_REVIEW->value);
        $this->entityManager->flush();

        $result = $this->post(self::IMPORT, $headers, $bundle);

        self::assertSame(['created' => 0, 'existing' => 2, 'approvedExisting' => 1], $result['combos']);
        self::assertSame(3, $this->reportComboCount());
        $this->entityManager->clear();
        self::assertSame(ModerationState::APPROVED->value, $this->entityManager->getRepository(ComboSequences::class)->findOneBy(['name' => 'CH: 2MK > 5HP'])?->getModerationState());
    }

    public function testOneUnknownMoveRejectsTheWholeBundle(): void
    {
        $bundle = $this->bundle();
        $bundle['combos'][1]['steps'][1]['move'] = '236XX';

        $result = $this->post(self::IMPORT, $this->moderatorHeaders(), $bundle);

        self::assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());
        self::assertSame('invalid', $result['status']);
        self::assertStringContainsString('steps[1]: Juri 236XX is not in this move catalog.', $result['errors'][0]);
        self::assertSame(0, $this->reportComboCount());
        self::assertSame(0, $this->entityManager->getRepository(Scenario::class)->count([]));
    }

    public function testOnlyModeratorsCanImport(): void
    {
        $this->client->request('POST', self::IMPORT, [], [], ['CONTENT_TYPE' => 'application/json'], json_encode($this->bundle(), JSON_THROW_ON_ERROR));
        self::assertSame(Response::HTTP_UNAUTHORIZED, $this->client->getResponse()->getStatusCode());

        $this->post(self::DRY_RUN, $this->loginHeaders($this->createUser([UserRole::USER])->getUsername()), $this->bundle());
        self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());
        self::assertSame(0, $this->reportComboCount());
    }

    public function testBuiltBundleDropsReplayTagsAndCarriesTheAliasedGrid(): void
    {
        $headers = $this->moderatorHeaders();
        $this->post(self::IMPORT, $headers, $this->bundle());
        $tagged = $this->entityManager->getRepository(ComboSequences::class)->findOneBy(['name' => 'CH: 2MK > 5HP']);
        $tagged?->setName('CH: 2MK > 5HP [AB12CD34E r1-s2-c3 t80]')->setDescription('Imported from a replay combo export. "2MK" read as "2MK"');
        $scenario = $this->entityManager->getRepository(Scenario::class)->findOneBy([]);
        self::assertInstanceOf(Scenario::class, $scenario);
        static::getContainer()->get(ScenarioAliasService::class)->assign($scenario, 'Juri 2HK oki');
        static::getContainer()->get(ScenarioResourceGridService::class)->computeAndStore($scenario);
        $this->entityManager->flush();

        $built = static::getContainer()->get(ReportBundleService::class)->build('juri-vs-ken', ['Juri', 'Ken'], 'sf6replaysdb');

        self::assertSame(['CH: 2MK > 5HP', 'PC: 5HP > 236HK', '623PP'], array_column($built['combos'], 'name'));
        self::assertArrayNotHasKey('description', $built['combos'][0]);
        self::assertStringNotContainsString('AB12CD34E', json_encode($built, JSON_THROW_ON_ERROR));
        self::assertSame('juri-2hk-oki', $built['resourceGrids']['grids'][0]['alias']);

        $this->entityManager->getConnection()->executeStatement('DELETE FROM sf6.scenario_resource_grid');
        $this->entityManager->getConnection()->executeStatement('DELETE FROM sf6.scenario_alias');
        $result = $this->post(self::IMPORT, $headers, $built);

        self::assertSame(1, $result['resourceGrids']);
        self::assertSame(1, $this->entityManager->getRepository(ScenarioResourceGrid::class)->count([]));
        self::assertSame('juri-2hk-oki', static::getContainer()->get(ScenarioAliasService::class)->findAlias($scenario));
    }

    /**
     * @return array<string, mixed>
     */
    private function bundle(): array
    {
        $step = static fn (string $character, string $move, string $connection, ?array $resource = null): array => ['character' => $character, 'move' => $move, 'connection' => $connection]
            + (null !== $resource ? ['resource' => $resource] : []);
        $dynamic = static fn (string $row, string $column, array $moves, string $hit): array => [
            'row' => $row, 'column' => $column, 'kind' => 'dynamic_combo',
            'starter' => ['initiator' => 'attacker', 'moves' => $moves, 'hitCondition' => $hit],
        ];

        return [
            'format' => ReportBundleService::FORMAT,
            'report' => 'juri-vs-ken',
            'combos' => [
                [
                    'name' => 'CH: 2MK > 5HP',
                    'metrics' => ['damage' => 1400],
                    'requirements' => ['counter_hit_required' => true],
                    'steps' => [$step('Juri', '2MK', 'Initial Move'), $step('Juri', '5HP', 'Link')],
                ],
                [
                    'name' => 'PC: 5HP > 236HK',
                    'metrics' => ['damage' => 2500, 'driveCost' => 1],
                    'requirements' => ['punish_counter_required' => true, 'combo_object_states' => [['object_key' => 'juri_fuha', 'status_required' => 1]]],
                    'steps' => [$step('Juri', '5HP', 'Initial Move'), $step('Juri', '236HK', 'Special', ['object' => 'juri_fuha', 'delta' => -1])],
                ],
                [
                    'name' => '623PP',
                    'metrics' => ['damage' => 2100],
                    'steps' => [$step('Ken', '623PP', 'Initial Move')],
                ],
            ],
            'scenarios' => ['format' => 'scenario_export_v1', 'scenarios' => [[
                'key' => ['source' => 'sf6replaysdb', 'externalId' => 'juri-vs-ken/2hk-oki'],
                'name' => 'Juri 2HK oki vs Ken',
                'scenarioType' => 'oki',
                'attacker' => 'Juri',
                'defender' => 'Ken',
                'situation' => ['triggerMove' => ['notation' => '2HK'], 'position' => 'midscreen', 'characterStatuses' => [['object' => 'juri_fuha', 'status' => 1]]],
                'rows' => [['key' => 'meaty', 'label' => 'Meaty 2MK', 'layer' => 1], ['key' => 'shimmy', 'label' => 'Shimmy', 'layer' => 1]],
                'columns' => [['key' => 'block', 'label' => 'Block', 'layer' => 1], ['key' => 'tech', 'label' => 'Throw tech', 'layer' => 1]],
                'cells' => [
                    ['row' => 'meaty', 'column' => 'block', 'kind' => 'static', 'value' => 0],
                    $dynamic('meaty', 'tech', ['2MK'], 'counter_hit'),
                    ['row' => 'shimmy', 'column' => 'block', 'kind' => 'static', 'value' => 0],
                    $dynamic('shimmy', 'tech', ['5HP'], 'punish_counter'),
                ],
            ]]],
            'resourceGrids' => ['format' => ScenarioResourceGridService::EXPORT_FORMAT, 'grids' => []],
        ];
    }

    private function persistCatalog(): void
    {
        $leafType = (new ComboSequenceType())->setName('leaf');
        $visibility = (new Visibility())->setName('public');
        foreach ([$leafType, (new ComboSequenceType())->setName('combo'), $visibility] as $entity) {
            $this->entityManager->persist($entity);
        }
        foreach (['Initial Move', 'Link', 'Special'] as $connection) {
            $this->entityManager->persist((new ConnectionType())->setName($connection));
        }

        $characters = ['Juri' => (new Character())->setName('Juri'), 'Ken' => (new Character())->setName('Ken')];
        foreach ($characters as $character) {
            $this->entityManager->persist($character);
        }
        foreach ([['Juri', '2HK', 900], ['Juri', '2MK', 500], ['Juri', '5HP', 800], ['Juri', '236HK', 1000], ['Ken', '623PP', 1600]] as [$characterName, $notation, $damage]) {
            $frameData = (new FrameData())->setMoveType('normal')->setDamage($damage);
            $move = (new Move())->setCharacter($characters[$characterName])->setNumpadNotation($notation)->setFrameData($frameData);
            $leaf = (new ComboSequences())->setName($notation)->setDescription('leaf')->setType($leafType)->setVisibility($visibility)->setMove($move);
            $move->setComboSequence($leaf);
            $this->entityManager->persist($frameData);
            $this->entityManager->persist($move);
            $this->entityManager->persist($leaf);
        }
        $this->entityManager->persist(
            (new CharacterObject())->setCharacterName('Juri')->setObjectKey('juri_fuha')->setName('Fuha')
                ->setKind(CharacterObject::KIND_STOCK)->setStatusType('integer')->setMaxStatus(3)->setCanBeConsumed(true)
        );
        $this->entityManager->flush();
    }

    private function reportComboCount(): int
    {
        return count($this->reportCombos());
    }

    /**
     * @return list<ComboSequences>
     */
    private function reportCombos(): array
    {
        $comboType = $this->entityManager->getRepository(ComboSequenceType::class)->findOneBy(['name' => 'combo']);

        return $this->entityManager->getRepository(ComboSequences::class)->findBy(['type' => $comboType], ['id' => 'ASC']);
    }

    /**
     * @param array<string, string> $headers
     * @param array<string, mixed> $body
     *
     * @return array<string, mixed>
     */
    private function post(string $uri, array $headers, array $body): array
    {
        $this->client->request('POST', $uri, [], [], $headers, json_encode($body, JSON_THROW_ON_ERROR));

        return json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
    }

    /** @return array<string, string> */
    private function moderatorHeaders(): array
    {
        return $this->loginHeaders($this->createUser([UserRole::MODERATOR])->getUsername());
    }

    /** @param list<UserRole> $roles */
    private function createUser(array $roles): User
    {
        $user = (new User())
            ->setUsername(sprintf('user_%s', bin2hex(random_bytes(4))))
            ->setPassword(self::hashTestPassword())
            ->setRoles(array_map(static fn (UserRole $role): string => $role->value, $roles))
            ->setIsActive(true);
        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    /** @return array<string, string> */
    private function loginHeaders(string $username): array
    {
        $this->client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => $username,
            'password' => 'testpassword',
        ], JSON_THROW_ON_ERROR));
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        return [
            'HTTP_X_CSRF_TOKEN' => (string) $payload['csrfToken'],
            'CONTENT_TYPE' => 'application/json',
        ];
    }
}
