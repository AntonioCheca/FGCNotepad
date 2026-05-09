<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\ComboNotationDictionaryTranslator;
use App\Service\NotationCanonicalizer;
use PHPUnit\Framework\TestCase;

final class NotationCanonicalizerTest extends TestCase
{
    public function testCanonicalizeSfShortRoute(): void
    {
        $canonicalizer = new NotationCanonicalizer(new ComboNotationDictionaryTranslator());

        $result = $canonicalizer->canonicalize('st. lp, cr. lk, cr. lp xx qcb+lp xx f+p');

        self::assertSame('5LP 2LK 2LP XX 214LP XX 6P', $result['canonicalNotation']);
        self::assertSame('st.', $result['tokenMap'][0]['rawToken']);
        self::assertSame('5LP', $result['tokenMap'][0]['canonicalToken']);
    }

    public function testCanonicalizeNumpadRouteRemainsCanonical(): void
    {
        $canonicalizer = new NotationCanonicalizer(new ComboNotationDictionaryTranslator());

        $result = $canonicalizer->canonicalize('5lp 2lk 2lp 214lp xx 6p');

        self::assertSame('5LP 2LK 2LP 214LP XX 6P', $result['canonicalNotation']);
    }
}
