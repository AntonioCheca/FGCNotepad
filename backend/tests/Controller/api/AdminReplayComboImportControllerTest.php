<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\ComboMetrics;
use App\Entity\ComboRequirement;
use App\Entity\ComboSequences;
use App\Entity\ComboSequenceType;
use App\Entity\ConnectionType;
use App\Entity\Move;
use App\Entity\Season;
use App\Entity\User;
use App\Entity\Visibility;
use App\Tests\DatabaseTestCase;
use App\Util\Enum\UserRole;
use Symfony\Component\HttpFoundation\Response;

final class AdminReplayComboImportControllerTest extends DatabaseTestCase
{
    public function testAdminImportsReadyCombosAndSkipsBlockedCombos(): void
    {
        $this->persistComboCatalog();
        $admin = $this->createUser([UserRole::ADMIN]);
        $headers = $this->loginHeaders($admin->getUsername(), 'testpassword');

        $this->client->request(
            'POST',
            '/api/admin/replay-combo-imports',
            [],
            [],
            $headers,
            json_encode($this->document([
                $this->combo('r1-s1-c1', true, [
                    ['kind' => 'move', 'notation' => '2LP', 'name' => 'Crouching Light Punch'],
                    ['kind' => 'move', 'notation' => '5LP', 'name' => 'Standing Light Punch'],
                ], 'counter_hit'),
                $this->combo('r1-s1-c2', false, [
                    ['kind' => 'unmapped', 'notation' => null, 'name' => null],
                ], null, ['unmapped_move']),
            ]), JSON_THROW_ON_ERROR)
        );

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(1, $payload['importedCount']);
        self::assertSame(1, $payload['skippedCount']);
        self::assertSame('imported', $payload['results'][0]['status']);
        self::assertSame('skipped', $payload['results'][1]['status']);

        $created = $this->entityManager->getRepository(ComboSequences::class)->find($payload['results'][0]['comboId']);
        self::assertInstanceOf(ComboSequences::class, $created);
        self::assertSame('pending_review', $created->getModerationState());
        self::assertSame('CH: 2LP > 5LP [RR95Y8A56 r1-s1-c1]', $created->getName());
        self::assertCount(2, $created->getSteps());
        self::assertSame('Initial Move', $created->getSteps()->first()->getConnectionType()?->getName());

        $requirement = $this->entityManager->getRepository(ComboRequirement::class)->findOneBy(['sequence' => $created]);
        self::assertInstanceOf(ComboRequirement::class, $requirement);
        self::assertTrue($requirement->isCounterHitRequired());
    }

    public function testPerfectParryStarterImportsWithPunishCounterAndObservedDamage(): void
    {
        $this->persistComboCatalog();
        $admin = $this->createUser([UserRole::ADMIN]);
        $headers = $this->loginHeaders($admin->getUsername(), 'testpassword');
        $sequence = [
            ['kind' => 'move', 'notation' => '2LP', 'name' => 'Crouching Light Punch'],
            ['kind' => 'move', 'notation' => '5LP', 'name' => 'Standing Light Punch'],
        ];
        $perfectParryCombo = ['damage' => 230, 'starter_defense' => ['perfect_parry' => true]] + $this->combo('r1-s1-c1', true, $sequence, 'punish_counter');
        $legacyCombo = ['starter_defense' => ['perfect_parry' => null]] + $this->combo('r1-s1-c2', true, [$sequence[1], $sequence[0]], 'punish_counter');
        $perfectParryWithoutPunishCounter = ['starter_defense' => ['perfect_parry' => true]] + $this->combo('r1-s1-c3', true, [$sequence[0]], 'normal');

        $this->client->request('POST', '/api/admin/replay-combo-imports', [], [], $headers, json_encode(
            $this->document([$perfectParryCombo, $legacyCombo, $perfectParryWithoutPunishCounter]),
            JSON_THROW_ON_ERROR
        ));

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['imported', 'imported', 'skipped'], array_column($payload['results'], 'status'));
        self::assertSame('starter_defense.perfect_parry requires a punish_counter starter.', $payload['results'][2]['reason']);

        $perfectParry = $this->entityManager->getRepository(ComboSequences::class)->find($payload['results'][0]['comboId']);
        self::assertInstanceOf(ComboSequences::class, $perfectParry);
        self::assertSame('PP+PC: 2LP > 5LP [RR95Y8A56 r1-s1-c1]', $perfectParry->getName());
        self::assertSame(230, $this->entityManager->getRepository(ComboMetrics::class)->findOneBy(['sequence' => $perfectParry])?->getDamage());
        $requirement = $this->entityManager->getRepository(ComboRequirement::class)->findOneBy(['sequence' => $perfectParry]);
        self::assertInstanceOf(ComboRequirement::class, $requirement);
        self::assertTrue($requirement->isPerfectParryRequired());
        self::assertTrue($requirement->isPunishCounterRequired());

        $legacy = $this->entityManager->getRepository(ComboSequences::class)->find($payload['results'][1]['comboId']);
        self::assertInstanceOf(ComboSequences::class, $legacy);
        self::assertStringStartsWith('PC: ', (string) $legacy->getName());
        $legacyRequirement = $this->entityManager->getRepository(ComboRequirement::class)->findOneBy(['sequence' => $legacy]);
        self::assertInstanceOf(ComboRequirement::class, $legacyRequirement);
        self::assertFalse($legacyRequirement->isPerfectParryRequired());
    }

    public function testAdminImportsComboExportBundleAndReportsPerDocumentErrors(): void
    {
        $this->persistComboCatalog();
        $admin = $this->createUser([UserRole::ADMIN]);
        $headers = $this->loginHeaders($admin->getUsername(), 'testpassword');
        $first = $this->document([
            $this->combo('r1-s1-c1', true, [
                ['kind' => 'move', 'notation' => '2LP', 'name' => 'Crouching Light Punch'],
                ['kind' => 'move', 'notation' => '5LP', 'name' => 'Standing Light Punch'],
            ], null),
        ]);
        $broken = $this->document([]);
        unset($broken['source']);

        $this->client->request('POST', '/api/admin/replay-combo-imports', [], [], $headers, json_encode([
            'format' => 'combo_export_bundle_v1',
            'documents' => [$first, $broken],
        ], JSON_THROW_ON_ERROR));

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(1, $payload['importedCount']);
        self::assertCount(2, $payload['documents']);
        self::assertSame(1, $payload['documents'][0]['importedCount']);
        self::assertSame('imported', $payload['documents'][0]['results'][0]['status']);
        self::assertSame(0, $payload['documents'][1]['importedCount']);
        self::assertSame('source must be an object.', $payload['documents'][1]['error']);
    }

    public function testBundleImportsRemainUsableAcrossDocumentBoundaries(): void
    {
        $this->persistComboCatalog();
        $admin = $this->createUser([UserRole::ADMIN]);
        $headers = $this->loginHeaders($admin->getUsername(), 'testpassword');
        $combo = $this->combo('r1-s1-c1', true, [
            ['kind' => 'move', 'notation' => '2LP', 'name' => 'Crouching Light Punch'],
            ['kind' => 'move', 'notation' => '5LP', 'name' => 'Standing Light Punch'],
        ], null);

        $this->client->request('POST', '/api/admin/replay-combo-imports', [], [], $headers, json_encode([
            'format' => 'combo_export_bundle_v1',
            'documents' => [
                $this->document([$combo], 'BUNDLEA001'),
                $this->document([$combo], 'BUNDLEB002'),
            ],
        ], JSON_THROW_ON_ERROR));

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(1, $payload['importedCount']);
        self::assertSame(1, $payload['observedCount']);
        self::assertSame('imported', $payload['documents'][0]['results'][0]['status']);
        self::assertSame('observed', $payload['documents'][1]['results'][0]['status']);
    }

    public function testSameMoveSequenceIsRecordedAsObservationNotDuplicated(): void
    {
        $this->persistComboCatalog();
        $admin = $this->createUser([UserRole::ADMIN]);
        $headers = $this->loginHeaders($admin->getUsername(), 'testpassword');
        $combo = fn (string $id): array => $this->combo($id, true, [
            ['kind' => 'move', 'notation' => '2LP', 'name' => 'Crouching Light Punch'],
            ['kind' => 'move', 'notation' => '5LP', 'name' => 'Standing Light Punch'],
        ], null);

        $payloads = [];
        foreach ([[$combo('a'), $combo('b')], [$combo('a'), $combo('c')]] as $combos) {
            $this->client->request('POST', '/api/admin/replay-combo-imports', [], [], $headers, json_encode($this->document($combos), JSON_THROW_ON_ERROR));
            $payloads[] = json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        }

        self::assertSame('imported', $payloads[0]['results'][0]['status']);
        self::assertSame('observed', $payloads[0]['results'][1]['status']);
        self::assertSame($payloads[0]['results'][0]['comboId'], $payloads[0]['results'][1]['comboId']);
        self::assertSame(1, $payloads[0]['observedCount']);
        self::assertSame('skipped', $payloads[1]['results'][0]['status']);
        self::assertSame('Already recorded for this replay.', $payloads[1]['results'][0]['reason']);
        self::assertSame('observed', $payloads[1]['results'][1]['status']);
        self::assertCount(1, array_filter($this->entityManager->getRepository(ComboSequences::class)->findAll(), static fn (ComboSequences $combo): bool => str_starts_with((string) $combo->getName(), '2LP > 5LP [')));
    }

    public function testImportRejectsUnsupportedDocumentFormat(): void
    {
        $admin = $this->createUser([UserRole::ADMIN]);
        $headers = $this->loginHeaders($admin->getUsername(), 'testpassword');
        $document = $this->document([]);
        $document['format'] = 'combo_export_v2';

        $this->client->request('POST', '/api/admin/replay-combo-imports', [], [], $headers, json_encode($document, JSON_THROW_ON_ERROR));

        self::assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());
    }

    public function testNonAdminCannotImportReplayCombos(): void
    {
        $user = $this->createUser([UserRole::USER]);
        $headers = $this->loginHeaders($user->getUsername(), 'testpassword');

        $this->client->request('POST', '/api/admin/replay-combo-imports', [], [], $headers, json_encode($this->document([]), JSON_THROW_ON_ERROR));

        self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());
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

    /**
     * @param list<array<string, mixed>> $combos
     *
     * @return array<string, mixed>
     */
    private function document(array $combos, string $replayId = 'RR95Y8A56'): array
    {
        return [
            'format' => 'combo_export_v1',
            'source' => [
                'replay_id' => $replayId,
                'source_sha256' => str_repeat('a', 64),
                'extractor_schema_version' => '0.17',
                'analysis_format' => 'replay_analysis_v1',
                'analyzer_name' => 'conservative_damaging_combo',
                'analyzer_version' => '1',
            ],
            'combos' => $combos,
        ];
    }

    /**
     * @param list<array<string, string|null>> $sequence
     * @param list<string> $blockers
     *
     * @return array<string, mixed>
     */
    private function combo(string $id, bool $ready, array $sequence, ?string $starterHitType, array $blockers = []): array
    {
        return [
            'id' => $id,
            'character' => 'Ed',
            'sequence' => $sequence,
            'sequence_notation' => '2LP > 5LP',
            'damage' => 400,
            'starter_hit_type' => $starterHitType,
            'ready_to_export' => $ready,
            'export_blockers' => $blockers,
        ];
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
