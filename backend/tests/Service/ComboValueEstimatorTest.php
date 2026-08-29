<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\ComboMetrics;
use App\Entity\CharacterObjectState;
use App\Entity\ComboRequirement;
use App\Entity\ComboSequences;
use App\Service\ComboValueEstimator;
use PHPUnit\Framework\TestCase;

final class ComboValueEstimatorTest extends TestCase
{
    public function testEstimateSubtractsResourceCostsAndAddsResourceGains(): void
    {
        $metrics = (new ComboMetrics())
            ->setDamage(2500)
            ->setDriveCost(2.0)
            ->setDriveGain(0.5)
            ->setSuperCost(1.0)
            ->setSuperGain(0.0);

        $estimator = new ComboValueEstimator();

        self::assertSame(1700.0, $estimator->estimateMetricsValue($metrics));
    }

    public function testMissingResourceValuesAreTreatedAsZero(): void
    {
        $metrics = (new ComboMetrics())->setDamage(1800);
        $estimator = new ComboValueEstimator();

        self::assertSame(1800.0, $estimator->estimateMetricsValue($metrics));
    }

    public function testSortByEstimatedValueCanRankLowerDamageComboFirst(): void
    {
        $expensive = new ComboSequences();
        $expensive->setName('Expensive');
        $expensive->setComboMetrics((new ComboMetrics())
            ->setSequence($expensive)
            ->setDamage(2500)
            ->setDriveCost(3.0)
            ->setSuperCost(1.0));

        $efficient = new ComboSequences();
        $efficient->setName('Efficient');
        $efficient->setComboMetrics((new ComboMetrics())
            ->setSequence($efficient)
            ->setDamage(2000));

        $estimator = new ComboValueEstimator();
        $sorted = $estimator->sortByEstimatedValue([$expensive, $efficient]);

        self::assertSame('Efficient', $sorted[0]->getName());
    }

    public function testApplyEstimatedValuePersistsCurrentFormulaResultOnMetrics(): void
    {
        $metrics = (new ComboMetrics())
            ->setDamage(2500)
            ->setDriveCost(2.0)
            ->setDriveGain(0.5)
            ->setSuperCost(1.0)
            ->setSuperGain(0.0);

        (new ComboValueEstimator())->applyEstimatedValue($metrics);

        self::assertSame(1700.0, $metrics->getResourceAdjustedDamage());
    }

    public function testEstimateSequenceValueAdjustsForConsumedAndGainedObjects(): void
    {
        $combo = new ComboSequences();
        $combo->setComboMetrics((new ComboMetrics())->setDamage(1000));
        $combo->setComboRequirement((new ComboRequirement())
            ->addCharacterObjectState((new CharacterObjectState())
                ->setObjectKey('juri_fuha')
                ->setObjectName('Fuha')
                ->setConsumed(true))
            ->addCharacterObjectState((new CharacterObjectState())
                ->setObjectKey('jamie_drinks')
                ->setObjectName('Drinks')
                ->setAddedRelative('2')));

        $estimator = new ComboValueEstimator();

        self::assertSame(1200.0, $estimator->estimateSequenceValue($combo, [
            'objectStatuses' => ['juri_fuha' => '2', 'jamie_drinks' => '1'],
        ]));
    }

    public function testApplySequenceResourceDeltasUpdatesMetersAndObjects(): void
    {
        $combo = new ComboSequences();
        $combo->setComboMetrics((new ComboMetrics())
            ->setDamage(1000)
            ->setDriveCost(2.0)
            ->setDriveGain(0.5)
            ->setSuperCost(1.0)
            ->setSuperGain(1.0));
        $combo->setComboRequirement((new ComboRequirement())
            ->addCharacterObjectState((new CharacterObjectState())
                ->setObjectKey('juri_fuha')
                ->setObjectName('Fuha')
                ->setConsumed(true))
            ->addCharacterObjectState((new CharacterObjectState())
                ->setObjectKey('jamie_drinks')
                ->setObjectName('Drinks')
                ->setAddedRelative('2')));

        $next = (new ComboValueEstimator())->applySequenceResourceDeltas($combo, [
            'drive' => 4.0,
            'super' => 1.0,
            'objectStatuses' => ['juri_fuha' => '2', 'jamie_drinks' => '1'],
        ]);

        self::assertSame(2.5, $next['drive']);
        self::assertSame(1.0, $next['super']);
        self::assertSame('1', $next['objectStatuses']['juri_fuha']);
        self::assertSame('3', $next['objectStatuses']['jamie_drinks']);
    }
}
