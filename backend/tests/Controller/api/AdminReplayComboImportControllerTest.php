<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\CharacterObject;
use App\Entity\CharacterObjectState;
use App\Entity\ComboMetrics;
use App\Entity\ComboRequirement;
use App\Entity\ComboResourceUsage;
use App\Entity\ComboSequences;
use App\Entity\ComboSequenceType;
use App\Entity\ComboSpacing;
use App\Entity\ConnectionType;
use App\Entity\Move;
use App\Entity\Season;
use App\Entity\Step;
use App\Entity\User;
use App\Entity\Visibility;
use App\Service\ComboResourceLedgerService;
use App\Service\ComboSequenceUpdateService;
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

    public function testStarterSpacingClassificationMapsToComboSpacing(): void
    {
        $this->persistComboCatalog();
        $this->persistComboSpacings();
        $admin = $this->createUser([UserRole::ADMIN]);
        $headers = $this->loginHeaders($admin->getUsername(), 'testpassword');
        $sequences = $this->distinctSequences();
        $classified = fn (int $index, mixed $starterSpacing): array => ['starter_spacing' => $starterSpacing] + $this->combo(sprintf('c%d', $index), true, $sequences[$index], null);
        $combos = [
            $classified(0, ['classification' => 'close', 'unclassified_reason' => null, 'distance' => 0.8]),
            $classified(1, ['classification' => 'mid', 'unclassified_reason' => null, 'distance' => 1.2]),
            $classified(2, ['classification' => 'far', 'unclassified_reason' => null, 'distance' => 1.4]),
            $classified(3, ['classification' => 'very_far', 'unclassified_reason' => null, 'distance' => 1.9]),
            $classified(4, ['classification' => null, 'unclassified_reason' => 'starter_not_normal']),
            $classified(5, null),
            $this->combo('c6', true, $sequences[6], null),
            $classified(7, ['classification' => 'point_blank']),
        ];

        $this->client->request('POST', '/api/admin/replay-combo-imports', [], [], $headers, json_encode($this->document($combos), JSON_THROW_ON_ERROR));

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(array_merge(array_fill(0, 7, 'imported'), ['skipped']), array_column($payload['results'], 'status'));
        self::assertSame('starter_spacing.classification must be close, mid, far, very_far, or null.', $payload['results'][7]['reason']);
        $spacingCodes = array_map(
            fn (array $result): ?string => $this->entityManager->getRepository(ComboSequences::class)->find($result['comboId'])?->getSpacing()?->getCode(),
            array_slice($payload['results'], 0, 7),
        );
        self::assertSame(['close', 'mid', 'tip', 'punish_tip', null, null, null], $spacingCodes);
    }

    public function testReobservedComboKeepsItsFurthestSpacing(): void
    {
        $this->persistComboCatalog();
        $this->persistComboSpacings();
        $admin = $this->createUser([UserRole::ADMIN]);
        $headers = $this->loginHeaders($admin->getUsername(), 'testpassword');
        $combo = fn (?string $classification): array => ['starter_spacing' => ['classification' => $classification]] + $this->combo('r1-s1-c1', true, $this->distinctSequences()[2], null);

        $results = [];
        $spacingCodes = [];
        foreach ([['mid', 'RR95Y8A56'], ['far', 'RR95Y8A57'], ['close', 'RR95Y8A58'], [null, 'RR95Y8A59']] as [$classification, $replayId]) {
            $this->client->request('POST', '/api/admin/replay-combo-imports', [], [], $headers, json_encode($this->document([$combo($classification)], $replayId), JSON_THROW_ON_ERROR));
            $results[] = json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR)['results'][0];
            $this->entityManager->clear();
            $spacingCodes[] = $this->entityManager->getRepository(ComboSequences::class)->find($results[0]['comboId'])?->getSpacing()?->getCode();
        }

        self::assertSame(['imported', 'observed', 'observed', 'observed'], array_column($results, 'status'));
        self::assertCount(1, array_unique(array_column($results, 'comboId')));
        self::assertSame(['mid', 'tip', 'tip', 'tip'], $spacingCodes);
    }

    public function testSameMovesWithDifferentStarterConditionsAreSeparateCombos(): void
    {
        $this->persistComboCatalog();
        $admin = $this->createUser([UserRole::ADMIN]);
        $headers = $this->loginHeaders($admin->getUsername(), 'testpassword');
        $sequence = $this->distinctSequences()[2];
        $combos = [
            $this->combo('c1', true, $sequence, null),
            $this->combo('c2', true, $sequence, 'punish_counter'),
            ['starter_defense' => ['perfect_parry' => true]] + $this->combo('c3', true, $sequence, 'punish_counter'),
            $this->combo('c4', true, $sequence, 'counter_hit'),
            $this->combo('c5', true, $sequence, 'punish_counter'),
        ];

        $this->client->request('POST', '/api/admin/replay-combo-imports', [], [], $headers, json_encode($this->document($combos), JSON_THROW_ON_ERROR));

        $results = json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR)['results'];
        self::assertSame(['imported', 'imported', 'imported', 'imported', 'observed'], array_column($results, 'status'));
        self::assertCount(4, array_unique(array_column($results, 'comboId')));
        self::assertSame($results[1]['comboId'], $results[4]['comboId']);
    }

    public function testReplayResourcesAreStoredOnStepsAndDeclaredStarts(): void
    {
        $this->persistComboCatalog();
        $this->persistEdResources();
        $combo = $this->resourceCombo('c1', 400, ['stock' => 2, 'medal_level' => 4], true, [$this->resourceChange('stock', 1, -1)]);

        $result = $this->importCombos([$combo])['results'][0];

        self::assertSame('imported', $result['status']);
        self::assertArrayNotHasKey('warnings', $result);
        $this->entityManager->clear();
        $created = $this->entityManager->getRepository(ComboSequences::class)->find($result['comboId']);
        self::assertInstanceOf(ComboSequences::class, $created);
        $changes = array_map(static fn (Step $step): array => [$step->getOrdinalInCombo(), $step->getResourceObject()?->getObjectKey(), $step->getResourceDelta()], $created->getSteps()->toArray());
        usort($changes, static fn (array $left, array $right): int => $left[0] <=> $right[0]);
        self::assertSame([[1, null, null], [2, 'ed_stock', -1]], $changes);

        $declared = [];
        foreach ($created->getComboRequirement()?->getCharacterObjectStates() ?? [] as $state) {
            self::assertInstanceOf(CharacterObjectState::class, $state);
            $declared[(string) $state->getObjectKey()] = $state->getStatusRequired();
        }
        ksort($declared);
        self::assertSame(['ed_install' => 'true', 'ed_scaler' => '4', 'ed_stock' => '2'], $declared);

        $ledger = static::getContainer()->get(ComboResourceLedgerService::class)->forCombo($created);
        $summary = array_combine(
            array_map(static fn (array $entry): string => $entry['resource']['object_key'], $ledger),
            array_map(static fn (array $entry): array => [$entry['start'], $entry['end'], array_column($entry['steps'], 'delta', 'ordinal')], $ledger),
        );
        ksort($summary);
        self::assertSame(['ed_install' => [1, 1, []], 'ed_scaler' => [4, 4, []], 'ed_stock' => [2, 1, [2 => -1]]], $summary);

        $usage = $this->entityManager->getRepository(ComboResourceUsage::class)->findOneBy(['combo' => $created, 'characterObject' => $this->edResource('ed_stock')]);
        self::assertInstanceOf(ComboResourceUsage::class, $usage);
        self::assertSame([2, 1, 0, 1], [$usage->getStartValue(), $usage->getSpent(), $usage->getGained(), $usage->getEndValue()]);
    }

    public function testDamageDecidesWhetherSameMovesAreTheSameCombo(): void
    {
        $this->persistComboCatalog();
        $this->persistEdResources();
        $combos = [
            $this->resourceCombo('c1', 500, ['medal_level' => 4], false, []),
            $this->resourceCombo('c2', 300, ['medal_level' => 1], false, []),
            $this->resourceCombo('c3', 300, ['medal_level' => 1, 'stock' => 1], false, []),
            $this->resourceCombo('c4', 520, ['medal_level' => 4], false, []),
        ];

        $results = $this->importCombos($combos)['results'];

        self::assertSame(['imported', 'imported', 'observed', 'observed'], array_column($results, 'status'));
        self::assertNotSame($results[0]['comboId'], $results[1]['comboId']);
        self::assertSame($results[1]['comboId'], $results[2]['comboId']);
        self::assertArrayNotHasKey('warnings', $results[2]);
        self::assertSame($results[0]['comboId'], $results[3]['comboId']);
        self::assertSame([sprintf('Same moves and resources as combo #%d, but damage 520 vs 500; recorded as that combo.', $results[0]['comboId'])], $results[3]['warnings']);
    }

    public function testUnplaceableResourceEvidenceIsWarnedAndTheComboStillImports(): void
    {
        $this->persistComboCatalog();
        $this->persistEdResources();
        $combo = $this->resourceCombo('c1', 400, ['unknown_resource' => 3], false, [
            ['resource' => 'stock', 'sequence_step_index' => null, 'delta' => -1, 'ambiguous_attribution' => true],
            $this->resourceChange('unknown_resource', 0, 1),
            $this->resourceChange('stock', 7, -1),
            ['resource' => null, 'sequence_step_index' => 0, 'delta' => 2, 'ambiguous_attribution' => false],
        ]);

        $result = $this->importCombos([$combo])['results'][0];

        self::assertSame('imported', $result['status']);
        self::assertSame([
            'Resource change -1 on stock is not attributed to a move and was not imported.',
            'Resource "unknown_resource" has no matching extractor key for this character; its +1 change was not imported.',
            'Stock change -1 is on sequence entry 7, which is not a stored step; it was not imported.',
            'Resource "an unmapped slot" has no matching extractor key for this character; its +2 change was not imported.',
            'Resource "unknown_resource" (3 at start) has no matching extractor key for this character.',
        ], $result['warnings']);
    }

    public function testResourceChangeAfterDriveRushCancelLandsOnTheFollowingMove(): void
    {
        $this->persistComboCatalog();
        $this->persistEdResources();
        $combo = ['sequence' => [
            ['kind' => 'move', 'notation' => '2LP', 'name' => 'Crouching Light Punch'],
            ['kind' => 'drive_rush_cancel', 'notation' => null, 'name' => null],
            ['kind' => 'move', 'notation' => '5LP', 'name' => 'Standing Light Punch'],
        ]] + $this->resourceCombo('c1', 400, ['stock' => 1], false, [$this->resourceChange('stock', 2, -1)]);

        $result = $this->importCombos([$combo])['results'][0];

        self::assertSame('imported', $result['status']);
        $step = $this->entityManager->getRepository(Step::class)->findOneBy(['parent_sequence' => $result['comboId'], 'ordinal_in_combo' => 2]);
        self::assertInstanceOf(Step::class, $step);
        self::assertSame(['ed_stock', -1], [$step->getResourceObject()?->getObjectKey(), $step->getResourceDelta()]);
    }

    public function testEditingAComboKeepsObservedResourceChangesOnUnchangedSteps(): void
    {
        $this->persistComboCatalog();
        $this->persistEdResources();
        $result = $this->importCombos([$this->resourceCombo('c1', 400, ['stock' => 1], false, [$this->resourceChange('stock', 1, -1)])])['results'][0];
        $this->entityManager->clear();
        $combo = $this->entityManager->getRepository(ComboSequences::class)->find($result['comboId']);
        self::assertInstanceOf(ComboSequences::class, $combo);
        $stepsPayload = array_map(static fn (Step $step): array => [
            'child_sequence_id' => $step->getChildSequence()?->getId(),
            'ordinal_in_combo' => $step->getOrdinalInCombo(),
            'connection_type_id' => $step->getConnectionType()?->getId(),
        ], $combo->getSteps()->toArray());

        static::getContainer()->get(ComboSequenceUpdateService::class)->updateFromPayload($combo, ['steps' => $stepsPayload]);
        $this->entityManager->flush();
        $this->entityManager->clear();

        $step = $this->entityManager->getRepository(Step::class)->findOneBy(['parent_sequence' => $result['comboId'], 'ordinal_in_combo' => 2]);
        self::assertInstanceOf(Step::class, $step);
        self::assertSame(['ed_stock', -1], [$step->getResourceObject()?->getObjectKey(), $step->getResourceDelta()]);
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

    private function persistEdResources(): void
    {
        $ed = $this->entityManager->getRepository(Character::class)->findOneBy(['name' => 'Ed']);
        $definitions = [
            ['ed_stock', 'Stock', CharacterObject::KIND_STOCK, 'integer', 3, 0, CharacterObject::SOURCE_NAMED, 'stock'],
            ['ed_scaler', 'Scaler', CharacterObject::KIND_SCALER, 'integer', 5, 1, CharacterObject::SOURCE_NAMED, 'medal_level'],
            ['ed_install', 'Install', CharacterObject::KIND_STATE, 'boolean', null, 0, CharacterObject::SOURCE_INSTALL, 'install'],
        ];
        foreach ($definitions as [$key, $name, $kind, $statusType, $max, $startsWith, $source, $extractorKey]) {
            $this->entityManager->persist(
                (new CharacterObject())
                    ->setCharacter($ed)
                    ->setCharacterName('Ed')
                    ->setObjectKey($key)
                    ->setName($name)
                    ->setKind($kind)
                    ->setStatusType($statusType)
                    ->setMaxStatus($max)
                    ->setStartsWith($startsWith)
                    ->setExtractorSource($source)
                    ->setExtractorKey($extractorKey)
                    ->setCanBeConsumed(CharacterObject::KIND_STOCK === $kind)
            );
        }
        $this->entityManager->flush();
    }

    private function edResource(string $objectKey): CharacterObject
    {
        $resource = $this->entityManager->getRepository(CharacterObject::class)->findOneBy(['objectKey' => $objectKey]);
        self::assertInstanceOf(CharacterObject::class, $resource);

        return $resource;
    }

    /** @return array<string, string> */
    private function adminHeaders(): array
    {
        $admin = $this->createUser([UserRole::ADMIN]);

        return $this->loginHeaders($admin->getUsername(), 'testpassword');
    }

    /**
     * @param list<array<string, mixed>> $combos
     *
     * @return array<string, mixed>
     */
    private function importCombos(array $combos): array
    {
        $this->client->request('POST', '/api/admin/replay-combo-imports', [], [], $this->adminHeaders(), json_encode($this->document($combos), JSON_THROW_ON_ERROR));
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        return json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
    }

    /**
     * @param array<string, int> $namedStarts
     * @param list<array<string, mixed>> $changes
     *
     * @return array<string, mixed>
     */
    private function resourceCombo(string $id, int $damage, array $namedStarts, bool $installActive, array $changes): array
    {
        return [
            'damage' => $damage,
            'resources_at_start' => [
                'install' => ['active' => $installActive, 'duration' => null, 'remaining' => null],
                'resources' => array_map(static fn (int $value): array => ['status' => 'provisional', 'value' => $value], $namedStarts),
            ],
            'resource_changes' => $changes,
        ] + $this->combo($id, true, $this->distinctSequences()[2], null);
    }

    /** @return array<string, mixed> */
    private function resourceChange(string $resource, int $sequenceStepIndex, int $delta): array
    {
        return ['resource' => $resource, 'sequence_step_index' => $sequenceStepIndex, 'delta' => $delta, 'ambiguous_attribution' => false, 'mapping_status' => 'provisional'];
    }

    private function persistComboSpacings(): void
    {
        foreach (['close', 'mid', 'tip', 'punish_tip'] as $sortOrder => $code) {
            $this->entityManager->persist((new ComboSpacing())->setCode($code)->setName($code)->setDescription($code)->setSortOrder($sortOrder));
        }
        $this->entityManager->flush();
    }

    /** @return list<list<array<string, string>>> */
    private function distinctSequences(): array
    {
        $steps = [
            '2LP' => ['kind' => 'move', 'notation' => '2LP', 'name' => 'Crouching Light Punch'],
            '5LP' => ['kind' => 'move', 'notation' => '5LP', 'name' => 'Standing Light Punch'],
        ];

        return array_map(
            static fn (string $notation): array => array_map(static fn (string $step): array => $steps[$step], explode(' ', $notation)),
            ['2LP', '5LP', '2LP 5LP', '5LP 2LP', '2LP 2LP', '5LP 5LP', '2LP 5LP 2LP', '5LP 2LP 5LP'],
        );
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
