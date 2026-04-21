<?php declare(strict_types=1);

namespace App\Tests\Service\ComboImport;

use App\Service\ComboImport\SfNotationTranslator;
use PHPUnit\Framework\TestCase;

final class SfNotationTranslatorTest extends TestCase
{
    public function testTranslateRecognizesNormalsSpecialsAndSupers(): void
    {
        $translator = new SfNotationTranslator();

        $result = $translator->translate('st. lp, cr. lk, qcb+lk, srk+hp, qcfx2+k');

        self::assertSame('5LP, 2LK, 214LK, 623HP, 236236K', $result['normalizedNotation']);
        self::assertSame([], $result['unknownTokens']);
    }

    public function testTranslateHandlesConnectorsAndModifiersWithoutBreaking(): void
    {
        $translator = new SfNotationTranslator();

        $result = $translator->translate('cr. lp (pc), cr. hp xx qcb+lk, cr. hk (air)');

        self::assertSame('2LP, 2HP, XX, 214LK, 2HK', $result['normalizedNotation']);
        self::assertSame([], $result['unknownTokens']);
    }

    public function testTranslateReportsUnknownTokens(): void
    {
        $translator = new SfNotationTranslator();

        $result = $translator->translate('st. lp, weird_token, qcf+lp');

        self::assertCount(1, $result['unknownTokens']);
        self::assertSame('weird_token', $result['unknownTokens'][0]);
        self::assertNotSame([], $result['warnings']);
    }
}
