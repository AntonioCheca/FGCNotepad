<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\Scenario;
use App\Entity\ScenarioCell;
use App\Entity\ScenarioColumn;
use App\Entity\ScenarioColumnResourceRequirement;
use App\Entity\ScenarioRow;
use App\Entity\ScenarioRowResourceRequirement;
use App\Service\ScenarioExecutionModeService;
use App\Service\ScenarioLayerSolveService;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

final class ScenarioLayerSolveServiceTest extends KernelTestCase
{
    public function testDriveAndSuperRequirementsArePricedIntoThePayoffs(): void
    {
        $scenario = new Scenario();
        $meaty = $this->row($scenario, 'Meaty', 0);
        $driveRush = $this->row($scenario, 'Drive Rush Meaty', 1)
            ->addResourceRequirement((new ScenarioRowResourceRequirement())->setResourceOwner('attacker')->setResourceType('drive')->setThresholdValue(2.0));
        $superCounter = (new ScenarioColumn())->setLabel('Super')->setPosition(0)->setLayer(1)
            ->addResourceRequirement((new ScenarioColumnResourceRequirement())->setResourceOwner('defender')->setResourceType('super')->setThresholdValue(1.0));
        $scenario->addColumn($superCounter);
        $this->cell($scenario, $meaty, $superCounter, 1000.0);
        $this->cell($scenario, $driveRush, $superCounter, 1300.0);

        $solution = static::getContainer()->get(ScenarioLayerSolveService::class)
            ->solveByLayer($scenario, ScenarioExecutionModeService::MODE_STANDARD, null, false);

        // Drive Rush costs 2 bars (-400), so plain Meaty wins; the defender's Super bar adds 500 to both.
        self::assertSame([1.0, 0.0], $solution['layers'][1]['rowAxis']);
        self::assertEqualsWithDelta(1500.0, $solution['layers'][1]['expectedValue'], 0.001);
    }

    private function row(Scenario $scenario, string $label, int $position): ScenarioRow
    {
        $row = (new ScenarioRow())->setLabel($label)->setPosition($position)->setLayer(1);
        $scenario->addRow($row);

        return $row;
    }

    private function cell(Scenario $scenario, ScenarioRow $row, ScenarioColumn $column, float $value): void
    {
        $scenario->addCell((new ScenarioCell())->setRow($row)->setColumn($column)->setKind(ScenarioCell::KIND_STATIC)->setStaticValue($value));
    }
}
