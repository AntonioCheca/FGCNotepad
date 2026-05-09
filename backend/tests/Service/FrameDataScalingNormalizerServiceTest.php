<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\FrameDataScalingNormalizerService;
use PHPUnit\Framework\TestCase;

final class FrameDataScalingNormalizerServiceTest extends TestCase
{
    private FrameDataScalingNormalizerService $service;

    protected function setUp(): void
    {
        $this->service = new FrameDataScalingNormalizerService();
    }

    public function testItParsesCoreStartImmediateMinimumComboAndMultiplierFields(): void
    {
        $result = $this->service->normalize('30% Minimum / 30% Start / 10% Immediate / Combo (2 hits)');

        self::assertSame(30, $result->minimumPercent);
        self::assertSame(30, $result->startPercent);
        self::assertSame(10, $result->immediatePercent);
        self::assertSame(2, $result->comboHits);
        self::assertSame('parsed', $result->parseStatus);
        self::assertSame([], $result->warnings);

        $multiplier = $this->service->normalize('15% Multiplier (Mid-Combo)');
        self::assertSame(15, $multiplier->multiplierPercent);
        self::assertSame('parsed', $multiplier->parseStatus);
    }

    public function testItNormalizesWhitespaceAndCaseVariants(): void
    {
        $result = $this->service->normalize("20% Start /\n Combo (2 hits)");

        self::assertSame(20, $result->startPercent);
        self::assertSame(2, $result->comboHits);
        self::assertSame('parsed', $result->parseStatus);

        $extra = $this->service->normalize('Combo (5% extra)');
        self::assertSame(5, $extra->comboExtraPercent);
        self::assertSame('parsed', $extra->parseStatus);
    }

    public function testItParsesComboExtraPercentForms(): void
    {
        $result = $this->service->normalize('Combo (2 hits + 5% extra)');

        self::assertSame(2, $result->comboHits);
        self::assertSame(5, $result->comboExtraPercent);
        self::assertSame('parsed', $result->parseStatus);

        $comboPercent = $this->service->normalize('20% Start / 15% Combo');
        self::assertSame(20, $comboPercent->startPercent);
        self::assertSame(15, $comboPercent->comboExtraPercent);
        self::assertSame('parsed', $comboPercent->parseStatus);
    }

    public function testItReturnsPartialForRareOrUnsupportedFragments(): void
    {
        $result = $this->service->normalize('50% Minimum / 10% Immediate (special)');

        self::assertSame(50, $result->minimumPercent);
        self::assertSame(10, $result->immediatePercent);
        self::assertSame('partial', $result->parseStatus);
        self::assertNotEmpty($result->warnings);

        $variant = $this->service->normalize('LK/MK: 20% Start / HK: Combo (2 hits)');
        self::assertSame('unparsed', $variant->parseStatus);
        self::assertNotEmpty($variant->warnings);

        $nestedPercent = $this->service->normalize('20%(10%) Start / Combo (2 hits)');
        self::assertSame(2, $nestedPercent->comboHits);
        self::assertSame('partial', $nestedPercent->parseStatus);
        self::assertNotEmpty($nestedPercent->warnings);
    }

    public function testItMarksNullAsUnparsedWithoutWarnings(): void
    {
        $result = $this->service->normalize(null);

        self::assertSame('unparsed', $result->parseStatus);
        self::assertSame([], $result->warnings);
    }
}
