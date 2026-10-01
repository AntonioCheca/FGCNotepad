<?php declare(strict_types=1);

namespace App\Tests\Command;

use App\Command\AuditComboDamageCommand;
use App\Service\ComboSequenceCreationService;
use App\Tests\ComboDamageAuditFixtures;
use App\Tests\DatabaseTestCase;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Tester\CommandTester;

final class AuditComboDamageCommandTest extends DatabaseTestCase
{
    private ComboDamageAuditFixtures $fixtures;
    private CommandTester $tester;

    protected function setUp(): void
    {
        parent::setUp();
        $this->fixtures = new ComboDamageAuditFixtures($this->entityManager, static::getContainer()->get(ComboSequenceCreationService::class));
        $this->tester = new CommandTester(static::getContainer()->get(AuditComboDamageCommand::class));
    }

    public function testItListsOnlyTheCombosThatDoNotMatchAndSummarisesTheRun(): void
    {
        $matching = $this->fixtures->createCombo(['5MP', '236HP'], 1800);
        $mismatching = $this->fixtures->createCombo(['236HP', '5MP'], 1000);

        $status = $this->tester->execute(['combo-ids' => [sprintf('%d-%d', $matching, $mismatching)]]);

        self::assertSame(Command::SUCCESS, $status);
        $display = $this->tester->getDisplay();
        self::assertStringContainsString('236HP > 5MP', $display);
        self::assertStringNotContainsString('5MP > 236HP', $display);
        self::assertStringContainsString('Checked 2 combos: 1 match, 1 mismatch, 0 unverifiable, 0 not found.', $display);
    }

    public function testAllAuditsEveryNonLeafComboAndJsonPrintsTheFullReport(): void
    {
        $comboId = $this->fixtures->createCombo(['5MP', '236HP'], 1800);

        $this->tester->execute(['--all' => true, '--json' => true]);

        $report = json_decode($this->tester->getDisplay(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(1, $report['checkedCount']);
        self::assertSame($comboId, $report['results'][0]['comboId']);
    }

    public function testItRejectsArgumentsThatAreNotIdsOrRanges(): void
    {
        self::assertSame(Command::INVALID, $this->tester->execute(['combo-ids' => ['12', 'abc']]));
        self::assertSame(Command::INVALID, $this->tester->execute([]));
    }
}
