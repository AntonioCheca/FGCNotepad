<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\ComboObservation;
use App\Entity\ComboSequences;
use App\Entity\ComboSequenceType;
use App\Entity\ConnectionType;
use App\Entity\Move;
use App\Entity\Replay;
use App\Entity\ReplayPlayer;
use App\Entity\Season;
use App\Entity\User;
use App\Entity\Visibility;
use App\Tests\DatabaseTestCase;
use App\Util\Enum\UserRole;
use Symfony\Component\HttpFoundation\Response;

final class ReplayContextImportControllerTest extends DatabaseTestCase
{
    public function testStoresReplayContextAndJoinsObservationToPerformerSlot(): void
    {
        $this->persistComboCatalog();
        $headers = $this->adminHeaders();

        $payload = $this->post($headers, $this->document('RPL000001', str_repeat('a', 64), [$this->combo('c1', 2)], $this->context()));

        self::assertSame(1, $payload['importedCount']);
        self::assertTrue($payload['replay']['metadataAvailable']);
        self::assertSame('2026-09-20T08:31:59+00:00', $payload['replay']['uploadedAt']);
        self::assertArrayNotHasKey('players', $payload['replay']);

        $replay = $this->entityManager->getRepository(Replay::class)->findOneBy(['extractorReplayId' => 'RPL000001']);
        self::assertInstanceOf(Replay::class, $replay);
        self::assertSame(20004000, $replay->getBattleVersion());
        self::assertSame(1, $replay->getBattleTypeRaw());
        self::assertSame(14, $replay->getGameModeRaw());
        self::assertNull($replay->getBattleType());
        self::assertFalse($replay->isRegistered());
        self::assertFalse($replay->isRivalAi());
        self::assertCount(2, $replay->getPlayers());

        $observation = $this->entityManager->getRepository(ComboObservation::class)->findOneBy(['replay' => $replay]);
        self::assertInstanceOf(ComboObservation::class, $observation);
        $performer = $observation->getPerformer();
        self::assertInstanceOf(ReplayPlayer::class, $performer);
        self::assertSame(2, $performer->getSlot());
        self::assertSame('MR', $performer->getRankMetric());
        self::assertSame(2178, $performer->getMasterRating());
        self::assertTrue($performer->isMaster());
        self::assertNull($performer->getLeagueTier());
        self::assertNull($performer->getRegion());
        self::assertSame('2599733375', $performer->getShortId());
        self::assertSame('Ed', $performer->getCharacter()?->getName());
        self::assertSame(400, $observation->getDamage());
    }

    public function testReimportCreatesNoDuplicateReplayPlayersOrObservations(): void
    {
        $this->persistComboCatalog();
        $headers = $this->adminHeaders();
        $document = $this->document('RPL000002', str_repeat('b', 64), [$this->combo('c1', 1)], $this->context());

        $this->post($headers, $document);
        $again = $this->post($headers, $document);

        self::assertSame(0, $again['importedCount']);
        self::assertSame('Already recorded for this replay.', $again['results'][0]['reason']);
        self::assertCount(1, $this->entityManager->getRepository(Replay::class)->findAll());
        self::assertCount(2, $this->entityManager->getRepository(ReplayPlayer::class)->findAll());
        self::assertCount(1, $this->entityManager->getRepository(ComboObservation::class)->findAll());
    }

    public function testMetadataArrivingLaterUpdatesTheSameReplayAndOlderExportDoesNotEraseIt(): void
    {
        $this->persistComboCatalog();
        $headers = $this->adminHeaders();

        $this->post($headers, $this->document('RPL000003', str_repeat('c', 64), [], $this->context(false)));
        $replay = $this->entityManager->getRepository(Replay::class)->findOneBy(['extractorReplayId' => 'RPL000003']);
        self::assertFalse($replay->isMetadataAvailable());
        self::assertNull($replay->getUploadedAt());
        self::assertNull($replay->getPlayerBySlot(2)->getRankMetric());

        $this->post($headers, $this->document('RPL000003', str_repeat('c', 64), [], $this->context()));
        $this->entityManager->clear();
        $replay = $this->entityManager->getRepository(Replay::class)->findOneBy(['extractorReplayId' => 'RPL000003']);
        self::assertCount(1, $this->entityManager->getRepository(Replay::class)->findAll());
        self::assertTrue($replay->isMetadataAvailable());
        self::assertSame(2178, $replay->getPlayerBySlot(2)->getMasterRating());

        $this->post($headers, $this->document('RPL000003', str_repeat('c', 64), [], $this->context(false)));
        $this->entityManager->clear();
        $replay = $this->entityManager->getRepository(Replay::class)->findOneBy(['extractorReplayId' => 'RPL000003']);
        self::assertTrue($replay->isMetadataAvailable());
        self::assertSame(2178, $replay->getPlayerBySlot(2)->getMasterRating());
    }

    public function testReextractionReplacesThatReplaysObservations(): void
    {
        $this->persistComboCatalog();
        $headers = $this->adminHeaders();

        $this->post($headers, $this->document('RPL000004', str_repeat('d', 64), [$this->combo('old-1', 1)], $this->context()));
        $payload = $this->post($headers, $this->document('RPL000004', str_repeat('e', 64), [$this->combo('new-1', 2)], $this->context()));

        self::assertSame(1, $payload['observedCount']);
        $observations = $this->entityManager->getRepository(ComboObservation::class)->findAll();
        self::assertCount(1, $observations);
        self::assertSame('new-1', $observations[0]->getOccurrenceId());
        self::assertSame(2, $observations[0]->getPerformer()->getSlot());
        self::assertSame(str_repeat('e', 64), $observations[0]->getReplay()->getSourceSha256());
    }

    public function testKnownComboGainsObservationFromSecondReplayWithDifferentPerformer(): void
    {
        $this->persistComboCatalog();
        $headers = $this->adminHeaders();

        $first = $this->post($headers, $this->document('RPL000005', str_repeat('1', 64), [$this->combo('c1', 1)], $this->context()));
        $second = $this->post($headers, $this->document('RPL000006', str_repeat('2', 64), [$this->combo('c1', 2)], $this->context()));

        self::assertSame('imported', $first['results'][0]['status']);
        self::assertSame('observed', $second['results'][0]['status']);
        self::assertSame($first['results'][0]['comboId'], $second['results'][0]['comboId']);
        self::assertCount(1, array_filter($this->entityManager->getRepository(ComboSequences::class)->findAll(), static fn (ComboSequences $combo): bool => str_starts_with((string) $combo->getName(), '2LP > 5LP [')));
        self::assertCount(2, $this->entityManager->getRepository(ComboObservation::class)->findBy(['combo' => $first['results'][0]['comboId']]));
    }

    public function testComboNameCarriesReplayIdOccurrenceAndOptionalTimerWithoutHostileCharacters(): void
    {
        $this->persistComboCatalog();
        $headers = $this->adminHeaders();
        $combo = $this->combo("r1-s1-c1'; DROP--<b>", 1);
        $combo['start_round_timer'] = 98;

        $payload = $this->post($headers, $this->document('RPLNAME01', str_repeat('9', 64), [$combo], $this->context()));

        $created = $this->entityManager->getRepository(ComboSequences::class)->find($payload['results'][0]['comboId']);
        self::assertSame('2LP > 5LP [RPLNAME01 r1-s1-c1DROP--b t98]', $created->getName());
    }

    public function testExportWithoutReplayContextStillImports(): void
    {
        $this->persistComboCatalog();
        $document = $this->document('RPL000007', str_repeat('3', 64), [$this->combo('c1', 2)], null);
        unset($document['replay_context']);

        $payload = $this->post($this->adminHeaders(), $document);

        self::assertSame(1, $payload['importedCount']);
        self::assertFalse($payload['replay']['metadataAvailable']);
        $observation = $this->entityManager->getRepository(ComboObservation::class)->findAll()[0];
        self::assertNull($observation->getPerformer());
    }

    public function testHostilePlayerNamesAreStoredVerbatimAndHarmless(): void
    {
        $this->persistComboCatalog();
        $headers = $this->adminHeaders();
        $names = [
            "'); DROP TABLE sf6.replay;--",
            '<script>alert(1)</script>',
            "nul\0byte",
            str_repeat('あ', 10000),
            "\u{202E}rtl 😀 第一種",
            "bad utf8 \xC3\x28",
        ];

        foreach ($names as $index => $name) {
            $context = $this->context();
            $context['players'][0]['cfn_name'] = $name;
            $payload = $this->post($headers, $this->document(sprintf('RPLHOST%d', $index), str_repeat('f', 63) . (string) $index, [$this->combo('c1', 1)], $context));
            self::assertArrayNotHasKey('error', $payload);
            self::assertSame(1, $payload['importedCount'] + $payload['observedCount'], $name);
        }

        $this->entityManager->clear();
        $stored = [];
        foreach ($this->entityManager->getRepository(Replay::class)->findBy([], ['id' => 'ASC']) as $replay) {
            $stored[] = $replay->getPlayerBySlot(1)->getCfnName();
        }

        self::assertSame("'); DROP TABLE sf6.replay;--", $stored[0]);
        self::assertSame('<script>alert(1)</script>', $stored[1]);
        self::assertSame('nulbyte', $stored[2]);
        self::assertSame(255, mb_strlen($stored[3]));
        self::assertSame("\u{202E}rtl 😀 第一種", $stored[4]);
        self::assertTrue(mb_check_encoding($stored[5], 'UTF-8'));
        self::assertCount(6, $this->entityManager->getRepository(Replay::class)->findAll());
    }

    public function testBundleImportsEachReplayContextAndReportsPerReplaySummary(): void
    {
        $this->persistComboCatalog();
        $bundle = [
            'format' => 'combo_export_bundle_v1',
            'documents' => [
                $this->document('RPLB0001', str_repeat('7', 64), [$this->combo('c1', 1)], $this->context()),
                $this->document('RPLB0002', str_repeat('8', 64), [$this->combo('c1', 2)], $this->context(false)),
            ],
        ];

        $payload = $this->post($this->adminHeaders(), $bundle);

        self::assertSame(1, $payload['importedCount']);
        self::assertSame(1, $payload['observedCount']);
        self::assertTrue($payload['documents'][0]['replay']['metadataAvailable']);
        self::assertFalse($payload['documents'][1]['replay']['metadataAvailable']);
    }

    /** @return array<string, string> */
    private function adminHeaders(): array
    {
        $admin = $this->createUser([UserRole::ADMIN]);

        return $this->loginHeaders($admin->getUsername(), 'testpassword');
    }

    /**
     * @param array<string, string> $headers
     * @param array<string, mixed> $body
     *
     * @return array<string, mixed>
     */
    private function post(array $headers, array $body): array
    {
        $this->client->request('POST', '/api/admin/replay-combo-imports', [], [], $headers, json_encode($body, JSON_THROW_ON_ERROR | JSON_INVALID_UTF8_SUBSTITUTE));
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());

        return json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
    }

    /**
     * @param list<array<string, mixed>> $combos
     * @param array<string, mixed>|null $context
     *
     * @return array<string, mixed>
     */
    private function document(string $replayId, string $sha, array $combos, ?array $context): array
    {
        return [
            'format' => 'combo_export_v1',
            'source' => [
                'replay_id' => $replayId,
                'source_sha256' => $sha,
                'extractor_schema_version' => '0.24',
                'analysis_format' => 'replay_analysis_v1',
                'analyzer_name' => 'conservative_damaging_combo',
                'analyzer_version' => '1',
            ],
            'replay_context' => $context,
            'combos' => $combos,
        ];
    }

    /** @return array<string, mixed> */
    private function combo(string $id, int $playerSlot): array
    {
        return [
            'id' => $id,
            'player_slot' => $playerSlot,
            'character' => 'Ed',
            'sequence' => [
                ['kind' => 'move', 'notation' => '2LP', 'name' => 'Crouching Light Punch'],
                ['kind' => 'move', 'notation' => '5LP', 'name' => 'Standing Light Punch'],
            ],
            'sequence_notation' => '2LP > 5LP',
            'damage' => 400,
            'starter_hit_type' => null,
            'ready_to_export' => true,
            'export_blockers' => [],
        ];
    }

    /** @return array<string, mixed> Modelled on a real 0.24 sample (8NFUGEL3Q). */
    private function context(bool $withMetadata = true): array
    {
        $rank = static fn (int $rating, int $ranking): array => [
            'metric' => 'MR', 'value' => $rating, 'is_master' => true, 'is_legend' => null, 'is_unranked' => null,
            'league_rank' => 36, 'league_point' => 555081, 'league_tier' => null, 'league_division' => null,
            'master_rating' => $rating, 'master_rating_ranking' => $ranking, 'master_league' => 41, 'master_tier' => null, 'mr_tier' => null,
        ];

        return [
            'metadata_available' => $withMetadata,
            'replay' => $withMetadata ? [
                'uploaded_at_unix' => 1789893119, 'uploaded_at_iso' => '2026-09-20T08:31:59Z', 'uploaded_at_raw' => 1789893119, 'uploaded_at_unit' => 's',
                'captured_at_unix' => 1789899990, 'battle_version' => 20004000, 'local_version' => 20004000, 'round_num' => 3, 'stage_id' => 30000,
                'battle_type_raw' => 1, 'game_mode_raw' => 14, 'battle_sub_type_raw' => 1, 'replay_tab_raw' => 99,
                'battle_type' => null, 'game_mode' => null, 'replay_tab' => null, 'is_registered' => false, 'is_rival_ai' => false,
            ] : null,
            'players' => [
                ['slot' => 1, 'character' => 'Ed', 'character_id' => 20, 'cfn_name' => 'Player One', 'short_id' => 3042706214, 'region' => null, 'region_id' => null, 'rank' => $withMetadata ? $rank(1753, 19202) : null],
                ['slot' => 2, 'character' => 'Ed', 'character_id' => 2, 'cfn_name' => 'Modern hater', 'short_id' => 2599733375, 'region' => null, 'region_id' => null, 'rank' => $withMetadata ? $rank(2178, 153) : null],
            ],
        ];
    }

    private function persistComboCatalog(): void
    {
        $comboType = (new ComboSequenceType())->setName('combo');
        $leafType = (new ComboSequenceType())->setName('leaf');
        $visibility = (new Visibility())->setName('public');
        $season = (new Season())->setName('S1')->setStartDate(new \DateTimeImmutable('2025-01-01'));
        $character = (new Character())->setName('Ed');

        $this->entityManager->persist($comboType);
        $this->entityManager->persist($leafType);
        $this->entityManager->persist($visibility);
        $this->entityManager->persist($season);
        $this->entityManager->persist($character);
        foreach (['Initial Move', 'Link', 'Drive Rush Cancel'] as $connectionName) {
            $this->entityManager->persist((new ConnectionType())->setName($connectionName));
        }
        $this->entityManager->flush();

        foreach (['2LP', '5LP'] as $notation) {
            $move = (new Move())->setCharacter($character)->setNumpadNotation($notation);
            $leaf = (new ComboSequences())
                ->setName(sprintf('Ed %s', $notation))
                ->setDescription('leaf')
                ->setMove($move)
                ->setType($leafType)
                ->setVisibility($visibility);
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
