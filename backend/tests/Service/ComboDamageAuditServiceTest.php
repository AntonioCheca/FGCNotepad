<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\ComboDamageAuditService;
use App\Service\ComboSequenceCreationService;
use App\Tests\ComboDamageAuditFixtures;
use App\Tests\DatabaseTestCase;

final class ComboDamageAuditServiceTest extends DatabaseTestCase
{
    private ComboDamageAuditFixtures $fixtures;
    private ComboDamageAuditService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->fixtures = new ComboDamageAuditFixtures($this->entityManager, static::getContainer()->get(ComboSequenceCreationService::class));
        $this->service = static::getContainer()->get(ComboDamageAuditService::class);
    }

    public function testStoredDamageEqualToTheEstimateIsAMatch(): void
    {
        $comboId = $this->fixtures->createCombo(['5MP', '236HP'], 1800);

        $report = $this->service->audit([$comboId]);

        self::assertSame(1, $report['matchCount']);
        self::assertSame('match', $report['results'][0]['status']);
        self::assertSame(0, $report['results'][0]['difference']);
        self::assertSame('Ryu', $report['results'][0]['character']);
        self::assertSame('5MP > 236HP', $report['results'][0]['notation']);
        self::assertSame([600, 1200], array_column($report['results'][0]['steps'], 'estimatedDamage'));
    }

    public function testStoredDamageDifferentFromTheEstimateIsAMismatchWithTheSignedDifference(): void
    {
        $comboId = $this->fixtures->createCombo(['5MP', '236HP'], 1500);

        $result = $this->service->audit([$comboId])['results'][0];

        self::assertSame('mismatch', $result['status']);
        self::assertSame(1500, $result['storedDamage']);
        self::assertSame(1800, $result['estimatedDamage']);
        self::assertSame(300, $result['difference']);
    }

    public function testTheEstimateUsesTheStoredStarterRequirement(): void
    {
        $comboId = $this->fixtures->createCombo(['5MP', '236HP'], 1920, ['punish_counter_required' => true]);

        $result = $this->service->audit([$comboId])['results'][0];

        self::assertSame('punish_counter', $result['starter']);
        self::assertSame('match', $result['status'], 'Punish Counter adds 20% to the 600 starter: 720 + 1200.');
    }

    public function testAStepWithoutFrameDataDamageMakesTheComboUnverifiable(): void
    {
        $comboId = $this->fixtures->createCombo(['5MP', '66', '236HP'], 1800);

        $report = $this->service->audit([$comboId]);

        self::assertSame(1, $report['unverifiableCount']);
        self::assertSame('unverifiable', $report['results'][0]['status']);
        self::assertSame([600, null, 1200], array_column($report['results'][0]['steps'], 'estimatedDamage'));
        self::assertSame(['Step "66" has no frame-data damage and was left out of the estimate.'], $report['results'][0]['warnings']);
    }

    public function testUnknownIdsAreReportedAsNotFoundInRequestOrder(): void
    {
        $comboId = $this->fixtures->createCombo(['5MP'], 600);

        $report = $this->service->audit([999999, $comboId, $comboId]);

        self::assertSame(2, $report['checkedCount']);
        self::assertSame(1, $report['notFoundCount']);
        self::assertSame(['comboId' => 999999, 'status' => 'not_found'], $report['results'][0]);
        self::assertSame($comboId, $report['results'][1]['comboId']);
    }
}
