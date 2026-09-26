<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\FrameDataImportBatch;
use App\Entity\FrameDataSupplementalValue;
use App\Entity\Move;
use App\Tests\DatabaseTestCase;
use App\Tests\NeutralStatsFixtures;
use Symfony\Component\HttpFoundation\Response;

final class NeutralStatsControllerTest extends DatabaseTestCase
{
    use NeutralStatsFixtures;

    /** @var array{ryu: Character, manon: Character} */
    private array $characters;

    protected function setUp(): void
    {
        parent::setUp();
        $this->characters = $this->persistNeutralCatalog();
    }

    public function testMoveProfilesUseRankedClassicObservationsWithZeroBucketsAndSharedScales(): void
    {
        $standHp = $this->entityManager->getRepository(Move::class)->findOneBy(['character' => $this->characters['ryu'], 'numpadNotation' => '5HP']);
        $standHp?->getFrameData()?->setSpacing(1.736);
        $this->entityManager->flush();
        $this->importNeutralBundle($this->neutralBundle([
            $this->neutralReplay('R1', [
                ['notation' => '5LP', 'spacing' => 0.1],
                ['notation' => '5LP', 'spacing' => 0.6],
                ['notation' => '5LP', 'spacing' => 0.7],
                ['notation' => '5HP', 'spacing' => 0.3],
                ['notation' => '5HP', 'spacing' => 0.3, 'route' => 'drive_rush'],
                ['notation' => '5MP', 'spacing' => 0.2, 'slot' => 2],
            ]),
            $this->neutralReplay('R2', [['notation' => '2MK', 'spacing' => 0.2]], ['mode' => 'CASUAL_MATCH']),
            $this->neutralReplay('R3', [['notation' => '2MK', 'spacing' => 0.2]], ['players' => [1 => ['control' => 'modern']]]),
            $this->neutralReplay('R4', [['notation' => '6MP', 'spacing' => 1.9]], ['players' => [1 => ['mr' => 1700]]]),
        ]));

        $payload = $this->stats();

        self::assertSame(['observationCount' => 5, 'replayCount' => 1, 'lowSample' => true], $payload['sample']);
        self::assertSame(0.25, $payload['spacing']['bucketSize']);
        self::assertEquals(2.0, $payload['spacing']['xMax'], 'X covers every spacing ever imported for Ryu, whatever the filters.');
        self::assertCount(8, $payload['spacing']['buckets']);
        self::assertSame(['start' => 0.25, 'end' => 0.5], $payload['spacing']['buckets'][1]);

        $cards = $payload['moveProfiles']['cards'];
        self::assertSame(['5LP', '5HP', 'DR > 5HP'], array_column($cards, 'label'));
        self::assertSame('Stand LP', $cards[0]['name']);
        self::assertSame(3, $cards[0]['total']);
        self::assertSame([1, 0, 2, 0, 0, 0, 0, 0], $cards[0]['counts']);
        self::assertSame(2, $payload['moveProfiles']['yMax']);
        self::assertSame(24, $payload['moveProfiles']['topLimit']);
        self::assertSame([null, 2.186, null], array_column($cards, 'maxRange'), 'Only raw cards with FAT range carry a reach: range plus the 0.45 hurtbox allowance.');
    }

    public function testSupplementalNameAndRangeFollowTheFrameDataOverlay(): void
    {
        $batch = (new FrameDataImportBatch())->setSourceType(FrameDataImportBatch::SOURCE_SUPPLEMENTAL)->setSourceVersion('csv')->setLabel('Supplemental');
        $move = $this->entityManager->getRepository(Move::class)->findOneBy(['character' => $this->characters['ryu'], 'numpadNotation' => '6MP']);
        self::assertInstanceOf(Move::class, $move);
        $move->getFrameData()?->setMoveName(null);
        $move->getFrameData()?->setSpacing(1.2);
        $supplemental = (new FrameDataSupplementalValue())->setImportBatch($batch)->setMove($move)->setMoveName('Collarbone Breaker');
        $supplemental->setValue('spacing', 1.6);
        $this->entityManager->persist($batch);
        $this->entityManager->persist($supplemental);
        $this->entityManager->flush();

        $this->importNeutralBundle($this->neutralBundle([$this->neutralReplay('R1', [['notation' => '6MP']])]));

        $card = $this->stats()['moveProfiles']['cards'][0];
        self::assertSame('Collarbone Breaker', $card['name']);
        self::assertSame(2.05, $card['maxRange'], 'The active supplemental range (1.6) wins over the FAT range, as in the frame data overlay.');
    }

    public function testRankRegionRelativeMrAndPatchFilters(): void
    {
        $this->importNeutralBundle($this->neutralBundle([
            $this->neutralReplay('GOLD', [['notation' => '5LP']], ['players' => [1 => ['mr' => null, 'leagueRank' => 23], 2 => ['mr' => null]]]),
            $this->neutralReplay('MR1550', [['notation' => '5HP']], ['players' => [1 => ['mr' => 1550], 2 => ['mr' => 1800]]]),
            $this->neutralReplay('MR1650', [['notation' => '2MK']], ['players' => [1 => ['mr' => 1650, 'region' => 'london'], 2 => ['mr' => 1600]], 'version' => 20005000]),
            $this->neutralReplay('LEGEND', [['notation' => '6MP']], ['players' => [1 => ['mr' => 2100, 'legend' => true], 2 => ['mr' => 2000]]]),
        ]));

        self::assertSame(['6MP'], $this->labels([]));
        self::assertSame(['2MK', '5HP', '5LP', '6MP'], $this->labels(['rankMin' => 'any']));
        self::assertSame(['5LP'], $this->labels(['rankMin' => 'lp:21', 'rankMax' => 'lp:25']));
        self::assertSame(['5HP', '5LP'], $this->labels(['rankMin' => 'lp:21', 'rankMax' => 'mr:1600']));
        self::assertSame(['2MK', '5HP'], $this->labels(['rankMin' => 'mr:1500', 'rankMax' => 'mr:1699']));
        self::assertSame(['6MP'], $this->labels(['rankMin' => 'legend']));
        self::assertSame(['2MK'], $this->labels(['rankMin' => 'any', 'region' => 'london,brazil']));
        self::assertSame(['5HP'], $this->labels(['rankMin' => 'any', 'relMr' => 'much_higher']));
        self::assertSame(['2MK', '6MP'], $this->labels(['rankMin' => 'any', 'relMr' => 'slightly_lower,lower']));
        self::assertSame(['2MK'], $this->labels(['rankMin' => 'any', 'patch' => 'latest']));
    }

    public function testGaugeAndResourceFiltersUseExactFrameState(): void
    {
        $this->importNeutralBundle($this->neutralBundle([
            $this->neutralReplay('R1', [
                ['notation' => '5LP', 'drive' => 10000, 'super' => 0, 'health' => 3000],
                ['notation' => '5HP', 'drive' => 55000, 'super' => 30000, 'health' => 9000, 'install' => ['active' => true],
                    'opponent' => ['drive' => 5000, 'resources' => ['medal_level' => ['value' => 4]]]],
                ['notation' => '2MK', 'drive' => 35000, 'super' => 15000, 'health' => 10000, 'install' => ['active' => false],
                    'opponent' => ['resources' => ['medal_level' => ['value' => 1]]]],
            ]),
        ]));
        $manon = (string) $this->characters['manon']->getId();

        self::assertSame(['2MK', '5HP'], $this->labels(['driveMin' => '3', 'driveMax' => '6']));
        self::assertSame(['2MK', '5LP'], $this->labels(['superMax' => '1.5']));
        self::assertSame(['2MK', '5HP'], $this->labels(['healthMin' => '5000']));
        self::assertSame(['5LP'], $this->labels(['healthMax' => '5000']));
        self::assertSame(['5HP'], $this->labels(['res' => ['ryu_denjin' => '1']]));
        self::assertSame(['2MK'], $this->labels(['res' => ['ryu_denjin' => '0']]));
        self::assertSame(['5HP'], $this->labels(['opponent' => $manon, 'oppRes' => ['manon_medals' => '3,4,5']]));
        self::assertSame(['5HP'], $this->labels(['opponent' => $manon, 'oppDriveMax' => '1']));
        self::assertSame(['2MK', '5HP', '5LP'], $this->labels(['oppRes' => ['manon_medals' => '3']]), 'Opponent filters need a matchup.');
        self::assertSame(['2MK', '5HP', '5LP'], $this->labels(['res' => ['manon_medals' => '3']]), 'Resources of another character are ignored.');
    }

    public function testNeutralDistributionNormalizesToBusiestBucketAndGroupsRareMoves(): void
    {
        $observations = [];
        foreach ([['5LP', 0.1, 40], ['5HP', 0.1, 20], ['5HP', 0.6, 30], ['236PP', 0.6, 5], ['236LP', 0.6, 4], ['HPHK', 0.6, 1]] as [$notation, $spacing, $count]) {
            for ($index = 0; $index < $count; ++$index) {
                $observations[] = ['notation' => $notation, 'spacing' => $spacing];
            }
        }
        for ($index = 0; $index < 3; ++$index) {
            $observations[] = ['notation' => '2MK', 'spacing' => 0.6, 'route' => 'drive_rush'];
        }
        $observations[] = ['notation' => '6MP', 'spacing' => 0.6];
        $this->importNeutralBundle($this->neutralBundle([$this->neutralReplay('R1', $observations)]));

        $payload = $this->stats(['bucket' => '0.5']);
        self::assertSame(104, $payload['sample']['observationCount']);
        self::assertFalse($payload['sample']['lowSample']);

        $series = $payload['distribution']['series'];
        self::assertSame(['5LP', '5HP', 'DR > 2MK', '236PP', '236LP', 'Other'], array_column($series, 'label'));
        self::assertSame(['light', 'heavy', 'drive_rush', 'special', 'special', 'other'], array_column($series, 'family'));
        self::assertSame([false, false, false, true, false, false], array_column($series, 'isOd'));
        self::assertEquals([38.5, 48.1, 2.9, 4.8, 3.8, 1.9], array_column($series, 'share'), 'Each series is a share of all filtered observations.');
        self::assertEqualsWithDelta([100.0, 73.333], array_map(static fn (int $bucket): float => array_sum(array_column(array_column($series, 'values'), $bucket)), [0, 1]), 0.01);
        self::assertEquals([66.667, 0.0], $series[0]['values']);
        self::assertSame(2, $series[5]['total'], '6MP and Drive Impact are each under 2% of all observations.');
        self::assertCount(7, $payload['moveProfiles']['cards'], 'Move Profiles keep rare moves.');
    }

    public function testCachedResponsesAreRetiredByANewImport(): void
    {
        $this->importNeutralBundle($this->neutralBundle([$this->neutralReplay('R1', [['notation' => '5LP']])]));
        self::assertSame(1, $this->stats()['sample']['observationCount']);

        $this->importNeutralBundle($this->neutralBundle([$this->neutralReplay('R2', [['notation' => '5LP']])]));
        self::assertSame(2, $this->stats()['sample']['observationCount']);
    }

    public function testOptionsExposeCharactersRanksAndCharacterResources(): void
    {
        $this->client->request('GET', '/api/neutral-stats/options', [
            'character' => (string) $this->characters['ryu']->getId(),
            'opponent' => (string) $this->characters['manon']->getId(),
        ]);

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['Manon', 'Ryu'], array_column($payload['characters'], 'name'));
        self::assertSame('mr:1800', $payload['defaultRankMin']);
        self::assertSame(['value' => 'lp:1', 'label' => 'Rookie 1'], $payload['ranks']['minimum'][0]);
        self::assertSame(['value' => 'legend', 'label' => 'Legend'], end($payload['ranks']['minimum']));
        self::assertSame([['value' => 0, 'label' => 'Off'], ['value' => 1, 'label' => 'On']], $payload['resources']['actor'][0]['values']);
        self::assertSame('manon_medals', $payload['resources']['opponent'][0]['key']);
        self::assertSame([0, 1, 2, 3, 4, 5], array_column($payload['resources']['opponent'][0]['values'], 'value'));
    }

    public function testInvalidFiltersAreClientErrors(): void
    {
        $ryu = (string) $this->characters['ryu']->getId();
        foreach ([[], ['character' => 'ryu'], ['character' => $ryu, 'bucket' => '0.3'], ['character' => $ryu, 'rankMin' => 'mr:x'], ['character' => $ryu, 'region' => 'mars'], ['character' => $ryu, 'driveMax' => '9']] as $query) {
            $this->client->request('GET', '/api/neutral-stats', $query);
            self::assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode(), json_encode($query, JSON_THROW_ON_ERROR));
        }

        $this->client->request('GET', '/api/neutral-stats', ['character' => '00000000-0000-0000-0000-000000000000']);
        self::assertSame(Response::HTTP_NOT_FOUND, $this->client->getResponse()->getStatusCode());
    }

    /**
     * @param array<string, mixed> $query
     *
     * @return array<string, mixed>
     */
    private function stats(array $query = []): array
    {
        $this->client->request('GET', '/api/neutral-stats', ['character' => (string) $this->characters['ryu']->getId()] + $query);
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());

        return json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
    }

    /**
     * @param array<string, mixed> $query
     *
     * @return list<string> card labels, sorted so assertions compare the matching set
     */
    private function labels(array $query): array
    {
        $labels = array_column($this->stats($query)['moveProfiles']['cards'], 'label');
        sort($labels);

        return $labels;
    }
}
