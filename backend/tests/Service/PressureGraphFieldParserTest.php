<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\PressureGraph\PressureGraphFieldParser;
use App\Util\Enum\PressureEdgeKind;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class PressureGraphFieldParserTest extends TestCase
{
    private PressureGraphFieldParser $parser;

    protected function setUp(): void
    {
        $this->parser = new PressureGraphFieldParser();
    }

    public function testLayerDefaultsToOneAndAcceptsNumericStrings(): void
    {
        self::assertSame(1, $this->parser->layer(null));
        self::assertSame(3, $this->parser->layer('3'));
    }

    public function testLayerOutsideRangeIsRejected(): void
    {
        $this->expectException(BadRequestHttpException::class);
        $this->parser->layer(0);
    }

    public function testEdgeKindDefaultsToNormal(): void
    {
        self::assertSame(PressureEdgeKind::NORMAL, $this->parser->edgeKind(null));
        self::assertSame(PressureEdgeKind::READ, $this->parser->edgeKind('read'));
    }

    public function testReadLabelIsOnlyKeptForReadsAndTrimmed(): void
    {
        self::assertSame('expects block', $this->parser->readLabel('  expects block ', PressureEdgeKind::READ));
        self::assertNull($this->parser->readLabel('expects block', PressureEdgeKind::CONFIRM));
        self::assertNull($this->parser->readLabel('   ', PressureEdgeKind::READ));
    }

    public function testOverlongReadLabelIsRejected(): void
    {
        $this->expectException(BadRequestHttpException::class);
        $this->parser->readLabel(str_repeat('x', PressureGraphFieldParser::READ_LABEL_MAX_LENGTH + 1), PressureEdgeKind::READ);
    }

    public function testZeroDamageMeansNoOutcome(): void
    {
        self::assertNull($this->parser->damage(0, 'damageDealt'));
        self::assertSame(1200, $this->parser->damage('1200', 'damageDealt'));
    }

    public function testDamageAboveFullHealthIsRejected(): void
    {
        $this->expectException(BadRequestHttpException::class);
        $this->parser->damage(10001, 'damageDealt');
    }
}
