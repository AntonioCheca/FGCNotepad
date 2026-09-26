<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\NeutralObservation;
use App\Entity\NeutralObservationResource;
use App\Entity\Replay;
use App\Tests\DatabaseTestCase;
use App\Tests\NeutralStatsFixtures;
use App\Util\Enum\UserRole;
use Symfony\Component\HttpFoundation\Response;

final class AdminNeutralStatsImportControllerTest extends DatabaseTestCase
{
    use NeutralStatsFixtures;

    public function testImportStoresExactSpacingFrameStateAndResources(): void
    {
        $this->persistNeutralCatalog();

        $result = $this->importNeutralBundle($this->neutralBundle([
            $this->neutralReplay('R1', [
                ['notation' => '236+LP', 'spacing' => 2.3582498168945, 'drive' => 49900, 'super' => 12345, 'health' => 8765, 'actionId' => 998,
                    'install' => ['active' => true, 'remaining' => 120],
                    'opponent' => ['drive' => 1000, 'resources' => ['medal_level' => ['value' => 3, 'status' => 'provisional'], 'unknown_key' => ['value' => 7]]]],
                ['notation' => '5HP', 'route' => 'drive_rush', 'slot' => 1],
            ]),
        ]));

        self::assertSame(1, $result['importedReplayCount']);
        self::assertSame(2, $result['importedObservationCount']);
        self::assertSame(0, $result['skippedObservationCount']);

        $observations = $this->entityManager->getRepository(NeutralObservation::class)->findBy([], ['sourceIndex' => 'ASC']);
        self::assertCount(2, $observations);
        [$special, $driveRush] = $observations;
        self::assertSame('236LP', $special->getMove()->getNumpadNotation());
        self::assertSame(2.3582498168945, $special->getSpacing());
        self::assertSame(998, $special->getActionId());
        self::assertSame(49900, $special->getActorDrive());
        self::assertSame(12345, $special->getActorSuper());
        self::assertSame(8765, $special->getActorHealth());
        self::assertTrue($special->isActorInstallActive());
        self::assertSame(120, $special->getActorInstallRemaining());
        self::assertSame(1000, $special->getOpponentDrive());
        self::assertSame('Manon', $special->getOpponentCharacter()?->getName());
        self::assertSame('drive_rush', $driveRush->getRoute());
        self::assertSame('5HP', $driveRush->getMove()->getNumpadNotation());

        $resources = $this->entityManager->getRepository(NeutralObservationResource::class)->findBy(['observation' => $special], ['sourceKey' => 'ASC']);
        self::assertCount(2, $resources);
        self::assertSame(['medal_level', 'opponent', 3, 'manon_medals'], [$resources[0]->getSourceKey(), $resources[0]->getSide(), $resources[0]->getValue(), $resources[0]->getCharacterObject()?->getObjectKey()]);
        self::assertSame(['unknown_key', null], [$resources[1]->getSourceKey(), $resources[1]->getCharacterObject()]);

        $replay = $this->entityManager->getRepository(Replay::class)->findOneBy(['extractorReplayId' => 'R1']);
        self::assertInstanceOf(Replay::class, $replay);
        self::assertSame('2', $replay->getNeutralAlgorithmVersion());
        self::assertNotNull($replay->getNeutralImportedAt());
    }

    public function testReimportReplacesPreviousObservationsOfTheReplay(): void
    {
        $this->persistNeutralCatalog();
        $this->importNeutralBundle($this->neutralBundle([
            $this->neutralReplay('R1', [['notation' => '5LP'], ['notation' => '5HP'], ['notation' => '2MK']]),
            $this->neutralReplay('R2', [['notation' => '5LP']]),
        ]));

        $this->importNeutralBundle($this->neutralBundle([
            $this->neutralReplay('R1', [['notation' => '6MP', 'spacing' => 0.5]], ['sha' => str_repeat('b', 64)]),
        ]));

        $this->entityManager->clear();
        $byReplay = [];
        foreach ($this->entityManager->getRepository(NeutralObservation::class)->findAll() as $observation) {
            $byReplay[$observation->getReplay()->getExtractorReplayId()][] = $observation->getMove()->getNumpadNotation();
        }
        ksort($byReplay);

        self::assertSame(['R1' => ['6MP'], 'R2' => ['5LP']], $byReplay);
    }

    public function testUnmappedMovesAndUnknownCharactersAreSkippedAndReported(): void
    {
        $this->persistNeutralCatalog();

        $result = $this->importNeutralBundle($this->neutralBundle([
            $this->neutralReplay('R1', [
                ['notation' => '5LP'],
                ['notation' => '214+HK', 'moveName' => 'Tatsumaki', 'actionId' => 777],
                ['notation' => '214+HK', 'moveName' => 'Tatsumaki', 'actionId' => 777],
            ]),
            $this->neutralReplay('R2', [['notation' => '5LP']], ['players' => [1 => ['character' => 'Yasmine']]]),
            ['source' => ['replay_id' => 'R3']],
        ]));

        self::assertSame(3, $result['replayCount']);
        self::assertSame(2, $result['importedReplayCount']);
        self::assertSame(4, $result['observationCount']);
        self::assertSame(1, $result['importedObservationCount']);
        self::assertSame(3, $result['skippedObservationCount']);
        self::assertSame([['character' => 'Ryu', 'notation' => '214+HK', 'actionId' => 777, 'moveName' => 'Tatsumaki', 'count' => 2]], $result['unmappedMoves']);
        self::assertSame(['Character "Yasmine" is not in FGCNotepad; its observations were skipped.'], $result['warnings']);
        self::assertSame('source.source_sha256 must be a non-empty string.', $result['replays'][2]['error']);
        self::assertCount(1, $this->entityManager->getRepository(NeutralObservation::class)->findAll());
    }

    public function testRejectsUnknownFormatAndNonAdmins(): void
    {
        $this->persistNeutralCatalog();
        $headers = $this->neutralLoginHeaders($this->createNeutralUser(UserRole::ADMIN));
        $this->client->request('POST', '/api/admin/neutral-stats-imports', [], [], $headers, json_encode(['format' => 'combo_export_v1'], JSON_THROW_ON_ERROR));
        self::assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());

        $this->client->getCookieJar()->clear();
        $headers = $this->neutralLoginHeaders($this->createNeutralUser(UserRole::USER));
        $this->client->request('POST', '/api/admin/neutral-stats-imports', [], [], $headers, json_encode($this->neutralBundle([]), JSON_THROW_ON_ERROR));
        self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());
    }
}
