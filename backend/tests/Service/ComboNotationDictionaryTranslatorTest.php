<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\ComboNotationDictionaryTranslator;
use PHPUnit\Framework\TestCase;

final class ComboNotationDictionaryTranslatorTest extends TestCase
{
    public function testTranslateSfShortToNumpad(): void
    {
        $translator = new ComboNotationDictionaryTranslator();

        $notation = 'st. lp, cr. lk, cr. lp xx qcb+lp xx f+p';
        $translated = $translator->toNumpadNotation($notation, ComboNotationDictionaryTranslator::DICTIONARY_SF_SHORT);

        self::assertSame('5LP 2LK 2LP XX 214LP XX 6P', $translated);
    }

    public function testTranslateNumpadToSfShort(): void
    {
        $translator = new ComboNotationDictionaryTranslator();

        $translated = $translator->fromNumpadNotation('5LP 2LK 2LP XX 214LP XX 6P', ComboNotationDictionaryTranslator::DICTIONARY_SF_SHORT);

        self::assertSame('st. lp cr. lk cr. lp xx qcb+lp xx f+p', $translated);
    }

    public function testTranslateDirectionAliasesToNumpad(): void
    {
        $translator = new ComboNotationDictionaryTranslator();

        $translated = $translator->toNumpadNotation('srk+hp qcfx2+p qcbx2+k hcf+p hcb+k dd df db b f 360 720', ComboNotationDictionaryTranslator::DICTIONARY_SF_SHORT);

        self::assertSame('623HP 236236P 214214K 41236P 63214K 22 3 1 4 6 360 720', $translated);
    }
}
