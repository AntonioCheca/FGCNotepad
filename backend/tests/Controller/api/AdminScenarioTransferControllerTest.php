<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\CharacterObject;
use App\Entity\ComboMetrics;
use App\Entity\ComboRequirement;
use App\Entity\ComboSequences;
use App\Entity\ComboSequenceType;
use App\Entity\ConnectionType;
use App\Entity\FrameData;
use App\Entity\Move;
use App\Entity\Scenario;
use App\Entity\ScenarioCell;
use App\Entity\Step;
use App\Entity\User;
use App\Entity\Visibility;
use App\Tests\DatabaseTestCase;
use App\Util\Enum\UserRole;
use Symfony\Component\HttpFoundation\Response;

final class AdminScenarioTransferControllerTest extends DatabaseTestCase
{
    private const SOURCE = 'sf6replaysdb';

    /** @var array<string, Move> */
    private array $moves = [];

    public function testDryRunShowsValuesMovingWithResourcesAndWritesNothing(): void
    {
        $this->persistCatalog();

        $report = $this->request('POST', '/api/admin/scenario-imports/dry-run', $this->adminHeaders(), $this->document());

        self::assertSame('ok', $report['status']);
        self::assertSame('create', $report['scenarios'][0]['action']);
        $meatyTech = $this->dynamicCell($report, 'meaty', 'tech');
        self::assertTrue($meatyTech['resolved']);
        // Resource-adjusted: the 3000 combo spends 1 Drive and 1 Super (3000 - 200 - 500).
        self::assertSame(2300, $meatyTech['value']);
        self::assertSame(
            ['0 Drive, 0 Super' => 1400, '3 Drive, 1 Super' => 2300, '6 Drive, 3 Super' => 2300, '6 Drive, 3 Super, Fuha 3' => 2300],
            array_column($meatyTech['levels'], 'value', 'label')
        );
        self::assertSame(0, $this->scenarioCount());
    }

    public function testImportSolvesLayersStoresProvenanceAndReimportIsIdempotent(): void
    {
        $this->persistCatalog();
        $headers = $this->adminHeaders();

        $created = $this->request('POST', '/api/admin/scenario-imports', $headers, $this->document());

        self::assertTrue($created['imported']);
        self::assertSame('create', $created['scenarios'][0]['action']);
        $id = $created['scenarios'][0]['id'];
        self::assertSame(sprintf('/scenarios/%s', $id), $created['scenarios'][0]['url']);
        self::assertSame('pending_review', $created['scenarios'][0]['moderationState']);
        self::assertSame([1, 2], array_keys($created['scenarios'][0]['layerExpectedValues']));
        self::assertNotNull($created['scenarios'][0]['layerExpectedValues'][1]);

        $scenario = $this->findScenario($id);
        self::assertCount(2, $scenario->getLayerSolutions());
        self::assertSame(2300.0, $this->cell($scenario, 'Meaty 2MK', 'Throw tech')->getCachedValue());
        $observed = $this->cell($scenario, 'Meaty 2MK', 'Block');
        self::assertSame(['observed', 31, 0.9, null], [$observed->getProvenanceStatus(), $observed->getProvenanceSampleCount(), $observed->getProvenanceConfidence(), $observed->getProvenanceNote()]);
        self::assertSame('Dash 2MK on the wakeup frame.', $this->rowDescription($scenario, 'Meaty 2MK'));
        self::assertSame(30, $scenario->getKnockdownAdvantage());

        $again = $this->request('POST', '/api/admin/scenario-imports', $headers, $this->document());
        self::assertSame('unchanged', $again['scenarios'][0]['action']);
        self::assertSame($id, $again['scenarios'][0]['id']);
        self::assertSame(1, $this->scenarioCount());

        $changed = $this->document();
        $changed['scenarios'][0]['cells'][2]['value'] = 1300;
        $updated = $this->request('POST', '/api/admin/scenario-imports', $headers, $changed);
        self::assertSame('update', $updated['scenarios'][0]['action']);
        self::assertSame($id, $updated['scenarios'][0]['id']);
        self::assertSame(1, $this->scenarioCount());
        self::assertSame(1300.0, $this->cell($this->findScenario($id), 'Throw', 'Block')->getStaticValue());
    }

    public function testRefusesImportWhileAStarterResolvesToNoCombo(): void
    {
        $this->persistCatalog();
        $document = $this->document();
        $document['scenarios'][0]['cells'][1]['starter']['moves'] = ['2HK'];

        $this->client->request('POST', '/api/admin/scenario-imports', [], [], $this->adminHeaders(), json_encode($document, JSON_THROW_ON_ERROR));

        self::assertSame(Response::HTTP_UNPROCESSABLE_ENTITY, $this->client->getResponse()->getStatusCode());
        $payload = $this->decode();
        self::assertSame('unresolved_starters', $payload['status']);
        self::assertFalse($payload['imported']);
        self::assertSame(['scenarios[0].cells[1].starter'], $payload['scenarios'][0]['unresolvedStarters']);
        self::assertSame(0, $this->scenarioCount());
    }

    public function testReportsUnknownCharactersAndMovesWithTheirPaths(): void
    {
        $this->persistCatalog();
        $document = $this->document();
        $document['scenarios'][0]['defender'] = 'Akuma';
        $document['scenarios'][0]['cells'][5]['starter']['moves'] = ['9XX'];

        $report = $this->request('POST', '/api/admin/scenario-imports/dry-run', $this->adminHeaders(), $document);

        self::assertSame('invalid', $report['status']);
        self::assertContains('scenarios[0].defender: unknown character "Akuma".', $report['errors']);
        self::assertContains('scenarios[0].cells[5].starter.moves[0]: no Juri move matches notation "9XX".', $report['errors']);
    }

    public function testSiteEditsBlockReimportUntilOverwriteIsRequested(): void
    {
        $this->persistCatalog();
        $headers = $this->adminHeaders();
        $id = $this->request('POST', '/api/admin/scenario-imports', $headers, $this->document())['scenarios'][0]['id'];

        $this->client->request('GET', sprintf('/api/scenarios/%s', $id), [], [], $headers);
        $matrix = $this->decode()['matrix'];
        $seenStats = ['rows' => [['frequency' => 0.46, 'sampleCount' => 57], null, null], 'columns' => [['frequency' => 0.52, 'sampleCount' => null], null]];
        self::assertSame($seenStats, ['rows' => $matrix['axes']['rowSeenStats'], 'columns' => $matrix['axes']['columnSeenStats']]);
        $matrix['cells'][1][0] = ['cellType' => 'value', 'dataType' => 'number', 'value' => 1111];
        $this->client->request('PATCH', sprintf('/api/scenarios/%s', $id), [], [], $headers, json_encode(['matrix' => $matrix], JSON_THROW_ON_ERROR));
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $this->client->request('GET', sprintf('/api/scenarios/%s', $id), [], [], $headers);
        $saved = $this->decode()['matrix']['axes'];
        self::assertSame($seenStats, ['rows' => $saved['rowSeenStats'], 'columns' => $saved['columnSeenStats']], 'Editor saves keep seen stats by label.');

        $edited = $this->findScenario($id);
        self::assertTrue($this->cell($edited, 'Meaty 2MK', 'Block')->hasProvenance(), 'Unchanged cells keep their provenance through an editor save.');
        self::assertFalse($this->cell($edited, 'Throw', 'Block')->hasProvenance(), 'An edited cell drops provenance it no longer matches.');
        self::assertSame('Dash 2MK on the wakeup frame.', $this->rowDescription($edited, 'Meaty 2MK'));

        $this->client->request('POST', '/api/admin/scenario-imports', [], [], $headers, json_encode($this->document(), JSON_THROW_ON_ERROR));
        self::assertSame(Response::HTTP_CONFLICT, $this->client->getResponse()->getStatusCode());
        self::assertSame('conflict', $this->decode()['scenarios'][0]['action']);
        self::assertSame(1111.0, $this->cell($this->findScenario($id), 'Throw', 'Block')->getStaticValue());

        $overwritten = $this->request('POST', '/api/admin/scenario-imports?overwriteSiteEdits=1', $headers, $this->document());
        self::assertSame('update', $overwritten['scenarios'][0]['action']);
        self::assertSame(1200.0, $this->cell($this->findScenario($id), 'Throw', 'Block')->getStaticValue());
    }

    public function testExportImportExportRoundTripIsIdenticalApartFromTimestamps(): void
    {
        $this->persistCatalog();
        $headers = $this->adminHeaders();
        $this->request('POST', '/api/admin/scenario-imports', $headers, $this->document(withReference: true));

        $first = $this->request('GET', '/api/admin/scenario-exports?source=' . self::SOURCE, $headers);
        self::assertCount(2, $first['scenarios']);
        self::assertSame(['initiator' => 'defender', 'moves' => ['623PP'], 'hitCondition' => 'normal'], $this->exportedCell($first, 'meaty-2mk', 'od-dp')['starter']);
        self::assertArrayNotHasKey('value', $this->exportedCell($first, 'meaty-2mk', 'throw-tech'));
        self::assertSame(0.62, $this->exportedCell($first, 'shimmy', 'od-dp')['reference']['weight']);
        self::assertArrayNotHasKey('weight', $this->exportedCell($first, 'throw', 'od-dp')['reference'], 'A weight of 1 is left out.');

        $this->deleteAllScenarios();
        $reimported = $this->request('POST', '/api/admin/scenario-imports', $headers, $first);
        self::assertSame(['create', 'create'], array_column($reimported['scenarios'], 'action'));

        $second = $this->request('GET', '/api/admin/scenario-exports?source=' . self::SOURCE, $headers);
        unset($first['exportedAt'], $second['exportedAt']);
        self::assertSame($first, $second);

        $unchanged = $this->request('POST', '/api/admin/scenario-imports/dry-run', $headers, $second);
        self::assertSame(['unchanged', 'unchanged'], array_column($unchanged['scenarios'], 'action'));
    }

    public function testPlainReferencesStorePreValuePlusWeightedLinkedEv(): void
    {
        $this->persistCatalog();

        $imported = $this->request('POST', '/api/admin/scenario-imports', $this->adminHeaders(), $this->document(withReference: true));

        // The follow-up has no links, so one pass already gives the exact value; the document's cachedValue (900) is
        // only the starting point.
        $followUpEv = $imported['scenarios'][1]['layerExpectedValues'][1];
        $main = $this->findScenario($imported['scenarios'][0]['id']);
        self::assertEqualsWithDelta(2500 + $followUpEv, $this->cell($main, 'Throw', 'OD DP')->getCachedValue(), 0.01);
        self::assertEqualsWithDelta(200 + 0.62 * $followUpEv, $this->cell($main, 'Shimmy', 'OD DP')->getCachedValue(), 0.01);
        self::assertSame(ScenarioCell::PERSPECTIVE_SAME, $this->cell($main, 'Shimmy', 'OD DP')->getReferencePerspective());
        self::assertSame(3, $imported['linkConvergence']['passes']);
        self::assertSame([], $imported['linkConvergence']['warnings']);
    }

    public function testImportSolvesSelfLinksAndCyclesWithAFixedNumberOfPasses(): void
    {
        $this->persistCatalog();
        $headers = $this->adminHeaders();

        $imported = $this->request('POST', '/api/admin/scenario-imports', $headers, $this->linkedDocument());

        self::assertTrue($imported['imported']);
        $this->entityManager->clear();
        [$kenOki, $juriOkiA, $juriOkiB] = array_map(
            fn (array $entry): ?Scenario => $this->entityManager->getRepository(Scenario::class)->findOneBy(['publicId' => $entry['id']]),
            $imported['scenarios']
        );
        self::assertNotNull($kenOki);
        self::assertNotNull($juriOkiA);
        self::assertNotNull($juriOkiB);
        // Cycle: a = 300 + 0.5b, b = 100 + 0.5a from (300, 100): (350, 250), (425, 275), then (437.5, 312.5).
        self::assertSame(437.5, $this->cell($juriOkiA, 'Meaty', 'Wake up')->getCachedValue());
        self::assertSame(312.5, $this->cell($juriOkiB, 'Meaty', 'Wake up')->getCachedValue());
        // Opponent side: Juri's oki EV after pass 2 (425) counts against Ken.
        self::assertSame(-200 - 0.25 * 425, $this->cell($kenOki, 'Strike', 'Delay tech')->getCachedValue());
        // Self-link: 1000 + 0.5 × the scenario's own EV.
        $throw = $this->cell($kenOki, 'Throw', 'Delay tech')->getCachedValue();
        self::assertNotNull($throw);
        self::assertGreaterThan(1000.0, $throw);

        $convergence = array_column($imported['linkConvergence']['scenarios'], null, 'name');
        self::assertSame(3, $imported['linkConvergence']['passes']);
        self::assertCount(3, $convergence);
        self::assertEqualsWithDelta(38.0, $convergence['Juri oki B']['lastPassDelta'], 0.5);
        self::assertFalse($convergence['Juri oki B']['settled']);
        self::assertTrue($convergence['Juri oki A']['settled']);
        self::assertCount(1, $imported['linkConvergence']['warnings']);
        self::assertStringStartsWith('Juri oki B: EV still moved by +38', $imported['linkConvergence']['warnings'][0]);

        $again = $this->request('POST', '/api/admin/scenario-imports', $headers, $this->linkedDocument());
        self::assertSame(['unchanged', 'unchanged', 'unchanged'], array_column($again['scenarios'], 'action'), 'Recomputed cachedValues are not site edits.');

        $exported = $this->request('GET', '/api/admin/scenario-exports/' . $imported['scenarios'][0]['id'], $headers);
        self::assertSame('opponent', $this->exportedCell($exported, 'strike', 'delay-tech')['reference']['perspective']);
        self::assertArrayNotHasKey('perspective', $this->exportedCell($exported, 'throw', 'delay-tech')['reference'], 'The same side is left out.');
    }

    public function testRejectsALinkWhoseAttackerDoesNotMatchItsPerspective(): void
    {
        $this->persistCatalog();
        $document = $this->linkedDocument();
        unset($document['scenarios'][0]['cells'][2]['reference']['perspective']);

        $this->client->request('POST', '/api/admin/scenario-imports', [], [], $this->adminHeaders(), json_encode($document, JSON_THROW_ON_ERROR));

        self::assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());
        self::assertContains(
            'scenarios[0].cells[2].reference.perspective: a same-side link needs the linked scenario\'s attacker to be this scenario\'s attacker (Ken), not Juri.',
            $this->decode()['errors']
        );
        self::assertSame(0, $this->scenarioCount());
    }

    public function testSiteCreatedScenarioKeepsItsPublicIdAcrossDatabases(): void
    {
        $this->persistCatalog();
        $headers = $this->adminHeaders();
        $created = $this->request('POST', '/api/admin/scenario-imports', $headers, $this->document());
        $scenario = $this->findScenario($created['scenarios'][0]['id']);
        $scenario->setImportKey(null, null)->setImportContentHash(null);
        $this->entityManager->flush();
        $publicId = $scenario->getPublicId()->toRfc4122();

        $export = $this->request('GET', sprintf('/api/admin/scenario-exports/%s', $publicId), $headers);
        self::assertSame(['source' => 'fgcnotepad', 'externalId' => $publicId], $export['scenarios'][0]['key']);
        self::assertSame('conflict', $this->request('POST', '/api/admin/scenario-imports/dry-run', $headers, $export)['scenarios'][0]['action']);

        $this->deleteAllScenarios();
        $imported = $this->request('POST', '/api/admin/scenario-imports', $headers, $export);
        self::assertSame($publicId, $imported['scenarios'][0]['id']);
    }

    public function testPerfectParryStarterUsesPerfectParryCombos(): void
    {
        $this->persistCatalog();
        $document = $this->document();
        $document['scenarios'][0]['cells'][5]['starter']['hitCondition'] = 'perfect_parry';

        $report = $this->request('POST', '/api/admin/scenario-imports/dry-run', $this->adminHeaders(), $document);

        self::assertSame(2500, $this->dynamicCell($report, 'shimmy', 'tech')['value']);
        self::assertSame(1500, $this->dynamicCell($this->request('POST', '/api/admin/scenario-imports/dry-run', $this->adminHeaders(), $this->document()), 'shimmy', 'tech')['value']);
    }

    public function testNonAdminsAreRejected(): void
    {
        $this->persistCatalog();
        $user = $this->createUser([UserRole::USER]);
        $userHeaders = $this->loginHeaders($user->getUsername());
        $endpoints = [
            ['POST', '/api/admin/scenario-imports/dry-run'],
            ['POST', '/api/admin/scenario-imports'],
            ['GET', '/api/admin/scenario-exports?source=' . self::SOURCE],
            ['GET', '/api/admin/scenario-exports/01a0fcbc-398b-7b66-9e6a-d1c1f647d144'],
        ];

        foreach ($endpoints as [$method, $uri]) {
            $this->client->request($method, $uri, [], [], $userHeaders, json_encode($this->document(), JSON_THROW_ON_ERROR));
            self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode(), $uri);
        }

        $this->client->getCookieJar()->clear();
        $this->client->request('GET', '/api/admin/scenario-exports?source=' . self::SOURCE);
        self::assertSame(Response::HTTP_UNAUTHORIZED, $this->client->getResponse()->getStatusCode());
        self::assertSame(0, $this->scenarioCount());
    }

    /**
     * @return array<string, mixed>
     */
    private function document(bool $withReference = false): array
    {
        $static = static fn (string $row, string $column, ?float $value, ?array $provenance = null): array => ['row' => $row, 'column' => $column, 'kind' => 'static', 'value' => $value]
            + (null !== $provenance ? ['provenance' => $provenance] : []);
        $dynamic = static fn (string $row, string $column, string $initiator, array $moves, string $hit): array => [
            'row' => $row, 'column' => $column, 'kind' => 'dynamic_combo',
            'starter' => ['initiator' => $initiator, 'moves' => $moves, 'hitCondition' => $hit],
        ];

        $main = [
            'key' => ['source' => self::SOURCE, 'externalId' => 'juri-vs-ken/2hk-oki'],
            'name' => 'Juri 2HK oki vs Ken',
            'scenarioType' => 'oki',
            'attacker' => 'Juri',
            'defender' => 'Ken',
            'situation' => [
                'triggerMove' => ['notation' => '2HK'],
                'position' => 'midscreen',
                'knockdownAdvantage' => 30,
                'characterStatuses' => [['object' => 'juri_fuha', 'status' => 1]],
            ],
            'rows' => [
                ['key' => 'meaty', 'label' => 'Meaty 2MK', 'description' => 'Dash 2MK on the wakeup frame.', 'layer' => 1, 'stats' => ['seenFrequency' => 0.46, 'sampleCount' => 57]],
                ['key' => 'throw', 'label' => 'Throw', 'layer' => 1],
                ['key' => 'shimmy', 'label' => 'Shimmy', 'layer' => 2, 'requirements' => [['owner' => 'attacker', 'resource' => 'drive', 'threshold' => 1]]],
            ],
            'columns' => [
                ['key' => 'block', 'label' => 'Block', 'layer' => 1, 'stats' => ['seenFrequency' => 0.52, 'sampleCount' => null]],
                ['key' => 'tech', 'label' => 'Throw tech', 'layer' => 1],
            ],
            'cells' => [
                $static('meaty', 'block', 0, ['status' => 'observed', 'sampleCount' => 31, 'confidence' => 0.9, 'note' => null]),
                $dynamic('meaty', 'tech', 'attacker', ['2MK'], 'counter_hit'),
                $static('throw', 'block', 1200, ['status' => 'inferred', 'sampleCount' => null, 'confidence' => null, 'note' => 'Throw damage.']),
                $static('throw', 'tech', 0),
                $static('shimmy', 'block', 0),
                $dynamic('shimmy', 'tech', 'attacker', ['5HP'], 'punish_counter'),
            ],
        ];

        if (!$withReference) {
            return ['format' => 'scenario_export_v1', 'scenarios' => [$main]];
        }

        $main['columns'][] = ['key' => 'od-dp', 'label' => 'OD DP', 'layer' => 2, 'requirements' => [['owner' => 'defender', 'resource' => 'drive', 'threshold' => 2]]];
        array_push(
            $main['cells'],
            $dynamic('meaty', 'od-dp', 'defender', ['623PP'], 'normal'),
            ['row' => 'throw', 'column' => 'od-dp', 'kind' => 'reference', 'reference' => [
                'scenario' => ['source' => self::SOURCE, 'externalId' => 'juri-vs-ken/after-whiffed-od-dp'],
                'mode' => 'reference',
                'cachedValue' => 900,
                'preValue' => ['kind' => 'dynamic_combo', 'starter' => ['initiator' => 'attacker', 'moves' => ['5HP'], 'hitCondition' => 'perfect_parry']],
            ]],
            ['row' => 'shimmy', 'column' => 'od-dp', 'kind' => 'reference', 'reference' => [
                'scenario' => ['source' => self::SOURCE, 'externalId' => 'juri-vs-ken/after-whiffed-od-dp'],
                'mode' => 'computed',
                'weight' => 0.62,
                'preValue' => ['kind' => 'static', 'value' => 200],
            ]],
        );

        $followUp = [
            'key' => ['source' => self::SOURCE, 'externalId' => 'juri-vs-ken/after-whiffed-od-dp'],
            'name' => 'Juri punishes a whiffed OD DP',
            'scenarioType' => 'oki',
            'attacker' => 'Juri',
            'defender' => 'Ken',
            'situation' => ['triggerMove' => ['character' => 'Ken', 'notation' => '623PP'], 'position' => 'corner'],
            'rows' => [['key' => 'punish', 'label' => 'Punish', 'layer' => 1]],
            'columns' => [['key' => 'recover', 'label' => 'Recover', 'layer' => 1]],
            'cells' => [$dynamic('punish', 'recover', 'attacker', ['5HP'], 'punish_counter')],
        ];

        return ['format' => 'scenario_export_v1', 'scenarios' => [$main, $followUp]];
    }

    /**
     * Ken's corner throw oki links to itself and, from the opponent's side, to Juri's oki A; Juri's okis A and B link
     * to each other.
     *
     * @return array<string, mixed>
     */
    private function linkedDocument(): array
    {
        $static = static fn (string $row, string $column, float $value): array => ['row' => $row, 'column' => $column, 'kind' => 'static', 'value' => $value];
        $reference = static fn (string $row, string $column, string $externalId, float $preValue, float $weight, ?string $perspective = null): array => [
            'row' => $row, 'column' => $column, 'kind' => 'reference', 'reference' => [
                'scenario' => ['source' => self::SOURCE, 'externalId' => $externalId],
                'mode' => 'reference',
                'weight' => $weight,
                'preValue' => ['kind' => 'static', 'value' => $preValue],
            ] + (null !== $perspective ? ['perspective' => $perspective] : []),
        ];
        $juriOki = static fn (string $name, string $externalId, string $linkedId, float $preValue): array => [
            'key' => ['source' => self::SOURCE, 'externalId' => $externalId],
            'name' => $name,
            'scenarioType' => 'oki',
            'attacker' => 'Juri',
            'defender' => 'Ken',
            'situation' => ['triggerMove' => ['notation' => '2HK'], 'position' => 'midscreen'],
            'rows' => [['key' => 'meaty', 'label' => 'Meaty', 'layer' => 1]],
            'columns' => [['key' => 'wake-up', 'label' => 'Wake up', 'layer' => 1]],
            'cells' => [$reference('meaty', 'wake-up', $linkedId, $preValue, 0.5)],
        ];

        $kenOki = [
            'key' => ['source' => self::SOURCE, 'externalId' => 'ken-vs-juri/throw-oki/corner'],
            'name' => 'Ken corner throw oki',
            'scenarioType' => 'oki',
            'attacker' => 'Ken',
            'defender' => 'Juri',
            'situation' => ['triggerMove' => ['notation' => '623PP'], 'position' => 'corner'],
            'rows' => [['key' => 'throw', 'label' => 'Throw', 'layer' => 1], ['key' => 'strike', 'label' => 'Strike', 'layer' => 1]],
            'columns' => [['key' => 'delay-tech', 'label' => 'Delay tech', 'layer' => 1], ['key' => 'block', 'label' => 'Block', 'layer' => 1]],
            'cells' => [
                $reference('throw', 'delay-tech', 'ken-vs-juri/throw-oki/corner', 1000, 0.5),
                $static('throw', 'block', 0),
                $reference('strike', 'delay-tech', 'juri-vs-ken/oki-a', -200, 0.25, 'opponent'),
                $static('strike', 'block', 1000),
            ],
        ];

        return ['format' => 'scenario_export_v1', 'scenarios' => [
            $kenOki,
            $juriOki('Juri oki A', 'juri-vs-ken/oki-a', 'juri-vs-ken/oki-b', 300),
            $juriOki('Juri oki B', 'juri-vs-ken/oki-b', 'juri-vs-ken/oki-a', 100),
        ]];
    }

    private function persistCatalog(): void
    {
        $juri = (new Character())->setName('Juri');
        $ken = (new Character())->setName('Ken');
        $this->entityManager->persist($juri);
        $this->entityManager->persist($ken);
        foreach ([[$juri, '2HK', 900], [$juri, '2MK', 500], [$juri, '5HP', 800], [$ken, '623PP', 1600]] as [$character, $notation, $damage]) {
            $move = (new Move())->setCharacter($character)->setNumpadNotation($notation);
            $frameData = (new FrameData())->setMoveType('normal')->setDamage($damage);
            $move->setFrameData($frameData);
            $this->entityManager->persist($frameData);
            $this->entityManager->persist($move);
            $this->moves[$notation] = $move;
        }
        $this->entityManager->persist(
            (new CharacterObject())->setCharacterName('Juri')->setObjectKey('juri_fuha')->setName('Fuha')
                ->setKind(CharacterObject::KIND_STOCK)->setStatusType('integer')->setMaxStatus(3)->setCanBeConsumed(true)
        );
        $this->entityManager->flush();

        $this->persistCombo($juri, '2MK', 1400, counterHit: true);
        $this->persistCombo($juri, '2MK', 1800, counterHit: true, driveCost: 2.0);
        $this->persistCombo($juri, '2MK', 3000, counterHit: true, driveCost: 1.0, superCost: 1.0);
        $this->persistCombo($juri, '5HP', 1500, punishCounter: true);
        $this->persistCombo($juri, '5HP', 2500, punishCounter: true, perfectParry: true);
        $this->persistCombo($ken, '623PP', 2100);
    }

    private function persistCombo(
        Character $character,
        string $starterNotation,
        int $damage,
        bool $counterHit = false,
        bool $punishCounter = false,
        bool $perfectParry = false,
        ?float $driveCost = null,
        ?float $superCost = null,
    ): void {
        $type = fn (string $name): ComboSequenceType => $this->entityManager->getRepository(ComboSequenceType::class)->findOneBy(['name' => $name])
            ?? (new ComboSequenceType())->setName($name);
        $leafType = $type('leaf');
        $comboType = $type('combo');
        $visibility = $this->entityManager->getRepository(Visibility::class)->findOneBy(['name' => 'public']) ?? (new Visibility())->setName('public');
        $connectionType = $this->entityManager->getRepository(ConnectionType::class)->findOneBy(['name' => 'Initial Move']) ?? (new ConnectionType())->setName('Initial Move');
        foreach ([$leafType, $comboType, $visibility, $connectionType] as $entity) {
            $this->entityManager->persist($entity);
        }

        $starter = $this->moves[$starterNotation];
        $leaf = $this->entityManager->getRepository(ComboSequences::class)->findOneBy(['move' => $starter, 'type' => $leafType]);
        if (!$leaf instanceof ComboSequences) {
            $leaf = (new ComboSequences())->setName($starterNotation)->setDescription('leaf')->setType($leafType)->setVisibility($visibility)->setMove($starter);
            $this->entityManager->persist($leaf);
        }

        $combo = (new ComboSequences())->setName(sprintf('%s %s %d', $character->getName(), $starterNotation, $damage))->setDescription('combo')->setType($comboType)->setVisibility($visibility);
        $this->entityManager->persist($combo);
        $this->entityManager->persist((new ComboMetrics())->setSequence($combo)->setDamage($damage)->setDriveCost($driveCost)->setSuperCost($superCost));
        $this->entityManager->persist((new Step())->setParentSequence($combo)->setChildSequence($leaf)->setOrdinalInCombo(1)->setConnectionType($connectionType));
        $this->entityManager->persist(
            (new ComboRequirement())
                ->setSequence($combo)
                ->setCounterHitRequired($counterHit)
                ->setPunishCounterRequired($punishCounter || $perfectParry)
                ->setPerfectParryRequired($perfectParry)
                ->setCornerRequired(false)
                ->setAirborneRequired(false)
                ->setNotCrouchingRequired(false)
        );
        $this->entityManager->flush();
    }

    /**
     * @param array<string, mixed> $report
     *
     * @return array<string, mixed>
     */
    private function dynamicCell(array $report, string $row, string $column): array
    {
        foreach ($report['scenarios'][0]['dynamicCells'] as $cell) {
            if ($cell['row'] === $row && $cell['column'] === $column) {
                return $cell;
            }
        }

        self::fail(sprintf('No dynamic cell %s/%s in the report.', $row, $column));
    }

    /**
     * @param array<string, mixed> $document
     *
     * @return array<string, mixed>
     */
    private function exportedCell(array $document, string $row, string $column): array
    {
        foreach ($document['scenarios'][0]['cells'] as $cell) {
            if ($cell['row'] === $row && $cell['column'] === $column) {
                return $cell;
            }
        }

        self::fail(sprintf('No exported cell %s/%s.', $row, $column));
    }

    private function cell(Scenario $scenario, string $rowLabel, string $columnLabel): ScenarioCell
    {
        foreach ($scenario->getCells() as $cell) {
            if ($cell->getRow()?->getLabel() === $rowLabel && $cell->getColumn()?->getLabel() === $columnLabel) {
                return $cell;
            }
        }

        self::fail(sprintf('No cell %s/%s.', $rowLabel, $columnLabel));
    }

    private function rowDescription(Scenario $scenario, string $label): ?string
    {
        foreach ($scenario->getRows() as $row) {
            if ($row->getLabel() === $label) {
                return $row->getDescription();
            }
        }

        return null;
    }

    private function findScenario(string $publicId): Scenario
    {
        $this->entityManager->clear();
        $scenario = $this->entityManager->getRepository(Scenario::class)->findOneBy(['publicId' => $publicId]);
        self::assertInstanceOf(Scenario::class, $scenario);

        return $scenario;
    }

    private function scenarioCount(): int
    {
        return $this->entityManager->getRepository(Scenario::class)->count([]);
    }

    private function deleteAllScenarios(): void
    {
        $this->entityManager->clear();
        foreach ($this->entityManager->getRepository(Scenario::class)->findAll() as $scenario) {
            foreach ($scenario->getCells() as $cell) {
                $cell->setReferenceScenario(null);
            }
        }
        $this->entityManager->flush();
        foreach ($this->entityManager->getRepository(Scenario::class)->findAll() as $scenario) {
            $this->entityManager->remove($scenario);
        }
        $this->entityManager->flush();
        $this->entityManager->clear();
        self::assertSame(0, $this->scenarioCount());
    }

    /**
     * @param array<string, string> $headers
     * @param array<string, mixed>|null $body
     *
     * @return array<string, mixed>
     */
    private function request(string $method, string $uri, array $headers, ?array $body = null): array
    {
        $this->client->request($method, $uri, [], [], $headers, null === $body ? null : json_encode($body, JSON_THROW_ON_ERROR));
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());

        return $this->decode();
    }

    /**
     * @return array<string, mixed>
     */
    private function decode(): array
    {
        return json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
    }

    /** @return array<string, string> */
    private function adminHeaders(): array
    {
        return $this->loginHeaders($this->createUser([UserRole::ADMIN])->getUsername());
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
        $payload = $this->decode();

        return [
            'HTTP_X_CSRF_TOKEN' => (string) $payload['csrfToken'],
            'CONTENT_TYPE' => 'application/json',
        ];
    }
}
