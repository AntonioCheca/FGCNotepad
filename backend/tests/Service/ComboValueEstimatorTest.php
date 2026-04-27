<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\ComboMetrics;
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

        $estimator = new ComboValueEstimator(200.0, 500.0);

        self::assertSame(1700.0, $estimator->estimateMetricsValue($metrics));
    }

    public function testMissingResourceValuesAreTreatedAsZero(): void
    {
        $metrics = (new ComboMetrics())->setDamage(1800);
        $estimator = new ComboValueEstimator(200.0, 500.0);

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

        $estimator = new ComboValueEstimator(200.0, 500.0);
        $sorted = $estimator->sortByEstimatedValue([$expensive, $efficient]);

        self::assertSame('Efficient', $sorted[0]->getName());
    }
}
