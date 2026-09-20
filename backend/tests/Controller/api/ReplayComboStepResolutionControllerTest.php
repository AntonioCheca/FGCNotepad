<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\ComboSequences;
use App\Entity\ComboSequenceType;
use App\Entity\ConnectionType;
use App\Entity\Move;
use App\Entity\Season;
use App\Entity\Step;
use App\Entity\User;
use App\Entity\Visibility;
use App\Tests\DatabaseTestCase;
use App\Util\Enum\UserRole;
use Symfony\Component\HttpFoundation\Response;

/** How the export's steps (connections, walking, targets, movement) become FGCNotepad combo steps. */
final class ReplayComboStepResolutionControllerTest extends DatabaseTestCase
{
    public function testExportConnectionsMapToCatalogueConnectionTypes(): void
    {
        $this->persistCatalog();

        $payload = $this->import([$this->combo('c1', [
            $this->move('5LP'),
            $this->move('2LP', 'chain_cancel'),
            $this->move('5HK', 'link'),
            $this->move('236+HP', 'special_cancel'),
            $this->move('214214K', 'super_cancel'),
        ])]);

        self::assertSame(['Initial Move', 'Chain', 'Link', 'Special', 'Super Cancel'], $this->connectionNames($payload['results'][0]['comboId']));
    }

    public function testUnclassifiedConnectionsFollowTheAgreedRules(): void
    {
        $this->persistCatalog();

        $payload = $this->import([
            $this->combo('landing', [$this->move('5LP'), $this->move('j.HP'), $this->move('2LP', null, 'JUMP_LAND')]),
            $this->combo('jumpcancel', [$this->move('5LP'), $this->move('236+HP', 'special_cancel'), $this->move('j.HP')]),
            $this->combo('supercancel', [$this->move('5LP'), $this->move('236+HP', 'special_cancel'), $this->move('214214K', null, 'SUPER')]),
            $this->combo('afterdr', [['kind' => 'drive_rush'] + $this->base(), $this->move('5HK')]),
            $this->combo('unknown', [$this->move('5LP'), $this->move('2LP')]),
        ]);

        self::assertSame(['Initial Move', 'Link', 'Link'], $this->connectionNames($payload['results'][0]['comboId']));
        self::assertSame(['Initial Move', 'Special', 'Special'], $this->connectionNames($payload['results'][1]['comboId']));
        self::assertSame(['Initial Move', 'Special', 'Super Cancel'], $this->connectionNames($payload['results'][2]['comboId']));
        self::assertSame(['Initial Move', 'Link'], $this->connectionNames($payload['results'][3]['comboId']));
        $unknown = $this->entityManager->getRepository(ComboSequences::class)->find($payload['results'][4]['comboId']);
        self::assertSame(['Initial Move', 'Link'], $this->connectionNames($payload['results'][4]['comboId']));
        self::assertStringContainsString('not classified by the extractor', (string) $unknown->getDescription());
    }

    public function testWalkBecomesATimedConnectionOnTheNextMove(): void
    {
        $this->persistCatalog();

        $payload = $this->import([
            $this->combo('back', [$this->move('5HK'), $this->walk('back', 13), $this->move('2MP', 'link')]),
            $this->combo('forward', [$this->move('5HK'), $this->walk('forward', 4), $this->move('236+HP', 'special_cancel')]),
            $this->combo('drc', [$this->move('5LP'), ['kind' => 'drive_rush_cancel'] + $this->base(), $this->walk('forward', 2), $this->move('2LP')]),
            $this->combo('trailing', [$this->move('5HK'), $this->move('2MP', 'chain_cancel'), $this->walk('forward', 3)]),
        ]);

        self::assertSame(['Initial Move', 'Walk Back'], $this->connectionNames($payload['results'][0]['comboId']));
        $step = $this->stepsOf($payload['results'][0]['comboId'])[1];
        self::assertSame(13, $step->getDelayMinFrames());
        self::assertSame(13, $step->getDelayMaxFrames());
        self::assertTrue($step->isDelayMinUnverified());
        self::assertTrue($step->isDelayMaxUnverified());
        self::assertSame(['Initial Move', 'Walk Forward'], $this->connectionNames($payload['results'][1]['comboId']));
        self::assertSame(['Initial Move', 'DR Cancel'], $this->connectionNames($payload['results'][2]['comboId']));
        self::assertNull($this->stepsOf($payload['results'][2]['comboId'])[1]->getDelayMinFrames());
        self::assertSame(['Initial Move', 'Chain'], $this->connectionNames($payload['results'][3]['comboId']));
        self::assertStringContainsString('[walk]', (string) $this->entityManager->getRepository(ComboSequences::class)->find($payload['results'][0]['comboId'])->getName());
    }

    public function testAWalkMakesItADifferentComboThanAPlainLink(): void
    {
        $this->persistCatalog();

        $payload = $this->import([
            $this->combo('plain', [$this->move('5HK'), $this->move('2MP', 'link')]),
            $this->combo('walk', [$this->move('5HK'), $this->walk('back', 13), $this->move('2MP')]),
            $this->combo('walk-again', [$this->move('5HK'), $this->walk('back', 20), $this->move('2MP')]),
        ]);

        self::assertSame('imported', $payload['results'][0]['status']);
        self::assertSame('imported', $payload['results'][1]['status']);
        self::assertNotSame($payload['results'][0]['comboId'], $payload['results'][1]['comboId']);
        self::assertSame('observed', $payload['results'][2]['status']);
        self::assertSame($payload['results'][1]['comboId'], $payload['results'][2]['comboId']);
    }

    public function testExportCharacterNamesMatchLooselyAgainstTheCatalogue(): void
    {
        $this->persistCatalog('E.Honda');
        $combo = $this->combo('c1', [$this->move('5LP'), $this->move('2LP', 'chain_cancel')]);
        $combo['character'] = 'E. Honda';

        $payload = $this->import([$combo]);

        self::assertSame('imported', $payload['results'][0]['status']);
    }

    public function testDashAndJumpBecomeMovementMovesAndMissingOnesAreNoted(): void
    {
        $this->persistCatalog();

        $payload = $this->import([
            $this->combo('dash', [$this->move('5LP'), ['kind' => 'dash', 'direction' => 'forward'] + $this->base(), $this->move('5HK')]),
            $this->combo('jump', [$this->move('5LP'), ['kind' => 'jump', 'direction' => 'neutral'] + $this->base(), $this->move('5HK')]),
            $this->combo('backdash', [$this->move('5LP'), ['kind' => 'dash', 'direction' => 'back'] + $this->base(), $this->move('5HK')]),
        ]);

        self::assertSame(['5LP', '66', '5HK'], $this->leafNotations($payload['results'][0]['comboId']));
        self::assertSame(['5LP', '8', '5HK'], $this->leafNotations($payload['results'][1]['comboId']));
        self::assertSame(['5LP', '5HK'], $this->leafNotations($payload['results'][2]['comboId']));
        self::assertStringContainsString('no "44" move', (string) $this->entityManager->getRepository(ComboSequences::class)->find($payload['results'][2]['comboId'])->getDescription());
    }

    public function testTargetComboHopsCollapseIntoTheCatalogueTargetLeaf(): void
    {
        $this->persistCatalog();

        $payload = $this->import([
            $this->combo('stance', [$this->move('5LP'), $this->move('5MP', 'link'), $this->target('5MP', '5MP > MK', ['MK'])]),
            $this->combo('exact', [$this->move('2MK'), $this->target('2MK', '2MK > HP', ['HP']), $this->move('5HK', 'link')]),
            $this->combo('threehit', [$this->move('5HK'), $this->target('5HK', '5HK > HP', ['HP']), $this->target('5HK', '5HK > HK', ['HK'])]),
            $this->combo('missing', [$this->move('5MP'), $this->target('5MP', '5MP > LK', ['LK'])]),
            $this->combo('unnamed', [$this->move('5MP'), $this->target('5MP', null, [])]),
        ]);

        self::assertSame(['5LP', '5MP > 5MK'], $this->leafNotations($payload['results'][0]['comboId']));
        self::assertSame(['Initial Move', 'Link'], $this->connectionNames($payload['results'][0]['comboId']));
        self::assertSame(['2MK > HP', '5HK'], $this->leafNotations($payload['results'][1]['comboId']));
        self::assertSame(['5HK > HP > HK'], $this->leafNotations($payload['results'][2]['comboId']));
        self::assertSame('skipped', $payload['results'][3]['status']);
        self::assertStringContainsString('Target leaf missing', $payload['results'][3]['reason']);
        self::assertStringContainsString('no target_notation', $payload['results'][4]['reason']);
    }

    public function testChargeBracketsAndUnknownStepKindsAreHandled(): void
    {
        $this->persistCatalog();

        $payload = $this->import([$this->combo('c1', [
            $this->move('5LP'),
            ['kind' => 'future_kind', 'foo' => 'bar'],
            $this->move('[2]8+LK', 'special_cancel'),
        ])]);

        self::assertSame(['5LP', '28LK'], $this->leafNotations($payload['results'][0]['comboId']));
    }

    public function testStrengthAgnosticAndMissingNotationsGiveClearReasons(): void
    {
        $this->persistCatalog();

        $payload = $this->import([
            $this->combo('c1', [$this->move('5LP'), $this->move('214+P', 'special_cancel')]),
            $this->combo('c2', [$this->move('5LP'), $this->move('4MK', 'link')]),
        ]);

        self::assertStringContainsString('does not say which strength', $payload['results'][0]['reason']);
        self::assertStringContainsString('No leaf move matches notation "4MK"', $payload['results'][1]['reason']);
    }

    public function testObservationKeepsStartTimingAndPlayerHomeIds(): void
    {
        $this->persistCatalog();
        $combo = $this->combo('c1', [$this->move('5LP'), $this->move('2LP', 'chain_cancel')]);
        $combo += ['start_round_timer' => 92, 'start_replay_frame' => 655, 'start_source_index' => 1200];

        $payload = $this->import([$combo], [
            'metadata_available' => true,
            'replay' => ['uploaded_at_unix' => 1789893119],
            'players' => [
                ['slot' => 1, 'character' => 'Ed', 'short_id' => 1, 'home_id' => 61, 'home_category_id' => 3, 'region' => 'london', 'region_id' => 4, 'rank' => null],
                ['slot' => 2, 'character' => 'Ed', 'short_id' => 2, 'home_id' => 999, 'home_category_id' => 7, 'region' => null, 'region_id' => null, 'rank' => null],
            ],
        ]);

        $observation = $this->entityManager->getRepository(\App\Entity\ComboObservation::class)->findAll()[0];
        self::assertSame(92, $observation->getStartRoundTimer());
        self::assertSame(655, $observation->getStartReplayFrame());
        self::assertSame(1200, $observation->getStartSourceIndex());
        self::assertSame(1, $payload['importedCount']);
        $players = $observation->getReplay()->getPlayers();
        self::assertSame(61, $players[0]->getHomeId());
        self::assertSame(3, $players[0]->getHomeCategoryId());
        self::assertSame(7, $players[1]->getHomeCategoryId());
    }

    /**
     * @param list<array<string, mixed>> $combos
     * @param array<string, mixed>|null $context
     *
     * @return array<string, mixed>
     */
    private function import(array $combos, ?array $context = null): array
    {
        $admin = $this->createUser([UserRole::ADMIN]);
        $headers = $this->loginHeaders($admin->getUsername(), 'testpassword');
        $document = [
            'format' => 'combo_export_v1',
            'source' => ['replay_id' => 'RPLSTEP01', 'source_sha256' => str_repeat('a', 64), 'extractor_schema_version' => '0.26', 'analysis_format' => 'replay_analysis_v1', 'analyzer_name' => 'x', 'analyzer_version' => '1'],
            'replay_context' => $context,
            'combos' => $combos,
        ];
        $this->client->request('POST', '/api/admin/replay-combo-imports', [], [], $headers, json_encode($document, JSON_THROW_ON_ERROR));
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        return json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
    }

    /** @return array<string, mixed> */
    private function base(): array
    {
        return ['name' => null, 'notation' => null, 'connection' => null, 'relation_kind' => null, 'entered_from' => null, 'direction' => null, 'duration_samples' => null, 'target_notation' => null, 'follow_up_buttons' => []];
    }

    /** @return array<string, mixed> */
    private function move(string $notation, ?string $connection = null, ?string $enteredFrom = null): array
    {
        return ['kind' => 'move', 'notation' => $notation, 'connection' => $connection, 'relation_kind' => $connection, 'entered_from' => $enteredFrom] + $this->base();
    }

    /** @return array<string, mixed> */
    private function walk(string $direction, int $samples): array
    {
        return ['kind' => 'walk', 'direction' => $direction, 'duration_samples' => $samples] + $this->base();
    }

    /**
     * @param list<string> $buttons
     *
     * @return array<string, mixed>
     */
    private function target(string $notation, ?string $targetNotation, array $buttons): array
    {
        return ['kind' => 'move', 'notation' => $notation, 'connection' => 'target_combo', 'relation_kind' => 'target_combo', 'target_notation' => $targetNotation, 'follow_up_buttons' => $buttons, 'entered_from' => 'ATCK'] + $this->base();
    }

    /**
     * @param list<array<string, mixed>> $sequence
     *
     * @return array<string, mixed>
     */
    private function combo(string $id, array $sequence): array
    {
        return [
            'id' => $id,
            'player_slot' => 1,
            'character' => 'Ed',
            'sequence' => $sequence,
            'sequence_notation' => 'unused',
            'damage' => 300,
            'starter_hit_type' => null,
            'ready_to_export' => true,
            'export_blockers' => [],
        ];
    }

    /** @return list<string> */
    private function connectionNames(int $comboId): array
    {
        return array_map(static fn (Step $step): string => (string) $step->getConnectionType()?->getName(), $this->stepsOf($comboId));
    }

    /** @return list<Step> */
    private function stepsOf(int $comboId): array
    {
        $this->entityManager->clear();
        $combo = $this->entityManager->getRepository(ComboSequences::class)->find($comboId);
        $steps = $combo->getSteps()->toArray();
        usort($steps, static fn (Step $a, Step $b): int => $a->getOrdinalInCombo() <=> $b->getOrdinalInCombo());

        return $steps;
    }

    /** @return list<string> */
    private function leafNotations(int $comboId): array
    {
        return array_map(static fn (Step $step): string => (string) $step->getChildSequence()?->getMove()?->getNumpadNotation(), $this->stepsOf($comboId));
    }

    private function persistCatalog(string $characterName = 'Ed'): void
    {
        $comboType = (new ComboSequenceType())->setName('combo');
        $leafType = (new ComboSequenceType())->setName('leaf');
        $visibility = (new Visibility())->setName('public');
        $season = (new Season())->setName('S1')->setStartDate(new \DateTimeImmutable('2025-01-01'));
        $character = (new Character())->setName($characterName);
        foreach ([$comboType, $leafType, $visibility, $season, $character] as $entity) {
            $this->entityManager->persist($entity);
        }
        foreach (['Initial Move', 'Link', 'Chain', 'Special', 'Super Cancel', 'DR Cancel', 'Walk Forward', 'Walk Back', 'Target Combo', 'Delay'] as $connectionName) {
            $this->entityManager->persist((new ConnectionType())->setName($connectionName));
        }
        $this->entityManager->flush();

        $notations = ['5LP', '2LP', '5HK', '2MP', '5MP', '2MK', '236HP', '214214K', '28LK', '8HP', 'DR', '66', '8', '5MP > 5MK', '2MK > HP', '5HK > HP > HK'];
        foreach ($notations as $notation) {
            $move = (new Move())->setCharacter($character)->setNumpadNotation($notation);
            $leaf = (new ComboSequences())->setName($notation)->setDescription('leaf')->setMove($move)->setType($leafType)->setVisibility($visibility);
            $this->entityManager->persist($move);
            $this->entityManager->persist($leaf);
        }
        $this->entityManager->flush();
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
    private function loginHeaders(string $username, string $password): array
    {
        $this->client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => $username,
            'password' => $password,
        ], JSON_THROW_ON_ERROR));
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        return [
            'HTTP_X_CSRF_TOKEN' => (string) $payload['csrfToken'],
            'CONTENT_TYPE' => 'application/json',
        ];
    }
}
