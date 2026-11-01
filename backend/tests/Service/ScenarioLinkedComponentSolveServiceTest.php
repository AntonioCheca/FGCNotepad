<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\Scenario;
use App\Entity\ScenarioCell;
use App\Entity\ScenarioColumn;
use App\Entity\ScenarioRow;
use App\Service\ScenarioLinkedComponentSolveService;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

final class ScenarioLinkedComponentSolveServiceTest extends KernelTestCase
{
    /**
     * Throw/Strike vs Delay tech/Block. The throw that lands leads back to the same oki: 1000 + 0.5 × EV.
     * With a = that cell and 1000 on the Strike/Block diagonal, EV = 1000a / (a + 1000), so the exact fixed point
     * solves v² + 3000v - 2000000 = 0.
     */
    public function testSelfLinkedScenarioLandsNearItsExactFixedPointAfterThreePasses(): void
    {
        $scenario = $this->scenario('Ken corner throw oki', ['Throw', 'Strike'], ['Delay tech', 'Block']);
        $throw = $this->reference($scenario, 0, 0, $scenario, 1000.0, 0.5);
        $this->staticCell($scenario, 0, 1, 0.0);
        $this->staticCell($scenario, 1, 0, 0.0);
        $this->staticCell($scenario, 1, 1, 1000.0);

        $report = $this->service()->solveAndStore([$scenario]);

        $exact = (-3000 + sqrt(17_000_000)) / 2;
        // The same passes by hand, with the solver's integer payoffs: pass 0 has no cachedValue, so the throw is 1000.
        $expectedValues = [500.0];
        for ($pass = 1; $pass <= 3; ++$pass) {
            $throwPayoff = round(1000 + 0.5 * $expectedValues[$pass - 1]);
            $expectedValues[] = 1000 * $throwPayoff / ($throwPayoff + 1000);
        }

        self::assertSame(3, $report['passes']);
        self::assertCount(1, $report['scenarios']);
        $entry = $report['scenarios'][0];
        // The solver rounds its mixes, which moves the EV by up to about 0.01.
        self::assertEqualsWithDelta($expectedValues[3], $entry['expectedValue'], 0.02);
        self::assertEqualsWithDelta($exact, $entry['expectedValue'], 0.1, 'Three passes land within 0.1 of the exact fixed point.');
        self::assertEqualsWithDelta($expectedValues[3] - $expectedValues[2], $entry['lastPassDelta'], 0.03);
        self::assertTrue($entry['settled']);
        self::assertSame([], $report['warnings']);

        self::assertEqualsWithDelta(1000 + 0.5 * $expectedValues[2], $throw->getCachedValue(), 0.02);
        self::assertEqualsWithDelta($entry['expectedValue'], $scenario->getLayerSolutions()->first()->getExpectedValue(), 0.001);
    }

    /**
     * Juri's oki and Ken's oki feed each other: each throw by the other character lands in the opponent's oki, so the
     * linked EV is subtracted. Fixed point: a = -1000 - 0.5b, b = -800 - 0.5a, so a = -800 and b = -400.
     */
    public function testOpponentSideCycleSubtractsTheLinkedEvAndStopsAfterTheFixedPasses(): void
    {
        $juriOki = $this->scenario('Juri oki vs Ken', ['Meaty'], ['Ken throws']);
        $kenOki = $this->scenario('Ken oki vs Juri', ['Meaty'], ['Juri throws']);
        $toKen = $this->reference($juriOki, 0, 0, $kenOki, -1000.0, 0.5, ScenarioCell::PERSPECTIVE_OPPONENT);
        $toJuri = $this->reference($kenOki, 0, 0, $juriOki, -800.0, 0.5, ScenarioCell::PERSPECTIVE_OPPONENT);

        $report = $this->service()->solveAndStore([$juriOki]);

        // Pass 0: -1000 / -800. Pass 1: -600 / -300. Pass 2: -850 / -500. Pass 3: -750 / -375.
        $byName = array_column($report['scenarios'], null, 'name');
        self::assertEqualsWithDelta(-750.0, $byName['Juri oki vs Ken']['expectedValue'], 0.001);
        self::assertEqualsWithDelta(100.0, $byName['Juri oki vs Ken']['lastPassDelta'], 0.001);
        self::assertEqualsWithDelta(-375.0, $byName['Ken oki vs Juri']['expectedValue'], 0.001);
        self::assertEqualsWithDelta(125.0, $byName['Ken oki vs Juri']['lastPassDelta'], 0.001);
        self::assertFalse($byName['Juri oki vs Ken']['settled']);
        self::assertCount(2, $report['warnings']);
        self::assertSame(-750.0, $toKen->getCachedValue());
        self::assertSame(-375.0, $toJuri->getCachedValue());

        // A second solve starts from the stored values, so the cycle keeps closing in on (-800, -400).
        $this->service()->solveAndStore([$kenOki], 5);
        self::assertEqualsWithDelta(-800.0, $toKen->getCachedValue(), 5.0);
        self::assertEqualsWithDelta(-400.0, $toJuri->getCachedValue(), 5.0);
    }

    public function testReferencesWithoutLinksToTheirOwnComponentKeepOnePassBehaviour(): void
    {
        $followUp = $this->scenario('After whiffed DP', ['Punish'], ['Recover']);
        $this->staticCell($followUp, 0, 0, 1500.0);
        $main = $this->scenario('Juri 2HK oki', ['Shimmy'], ['OD DP']);
        $shimmy = $this->reference($main, 0, 0, $followUp, 200.0, 0.62);

        $report = $this->service()->solveAndStore([$main]);

        self::assertEqualsWithDelta(200 + 0.62 * 1500, $shimmy->getCachedValue(), 0.001);
        foreach ($report['scenarios'] as $entry) {
            self::assertEqualsWithDelta(0.0, $entry['lastPassDelta'], 0.001);
        }
    }

    private function service(): ScenarioLinkedComponentSolveService
    {
        return static::getContainer()->get(ScenarioLinkedComponentSolveService::class);
    }

    /**
     * @param list<string> $rows
     * @param list<string> $columns
     */
    private function scenario(string $name, array $rows, array $columns): Scenario
    {
        $scenario = (new Scenario())->setName($name);
        foreach ($rows as $position => $label) {
            $scenario->addRow((new ScenarioRow())->setLabel($label)->setPosition($position)->setLayer(1));
        }
        foreach ($columns as $position => $label) {
            $scenario->addColumn((new ScenarioColumn())->setLabel($label)->setPosition($position)->setLayer(1));
        }

        return $scenario;
    }

    private function staticCell(Scenario $scenario, int $row, int $column, float $value): void
    {
        $scenario->addCell($this->placedCell($scenario, $row, $column)->setKind(ScenarioCell::KIND_STATIC)->setStaticValue($value));
    }

    private function reference(Scenario $scenario, int $row, int $column, Scenario $linked, float $preValue, float $weight, string $perspective = ScenarioCell::PERSPECTIVE_SAME): ScenarioCell
    {
        $cell = $this->placedCell($scenario, $row, $column)
            ->setKind(ScenarioCell::KIND_REFERENCE)
            ->setReferenceScenario($linked)
            ->setReferenceKind('reference')
            ->setReferenceWeight($weight)
            ->setReferencePerspective($perspective)
            ->setStaticValue($preValue);
        $scenario->addCell($cell);

        return $cell;
    }

    private function placedCell(Scenario $scenario, int $row, int $column): ScenarioCell
    {
        return (new ScenarioCell())
            ->setRow($scenario->getRows()->toArray()[$row])
            ->setColumn($scenario->getColumns()->toArray()[$column]);
    }
}
