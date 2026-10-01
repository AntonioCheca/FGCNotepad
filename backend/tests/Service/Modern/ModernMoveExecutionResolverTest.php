<?php declare(strict_types=1);

namespace App\Tests\Service\Modern;

use App\Entity\Character;
use App\Entity\Move;
use App\Service\Modern\ModernMoveExecutionResolver;
use App\Util\Enum\ComboExecutionMode;
use PHPUnit\Framework\TestCase;

final class ModernMoveExecutionResolverTest extends TestCase
{
    private ModernMoveExecutionResolver $resolver;

    protected function setUp(): void
    {
        $this->resolver = new ModernMoveExecutionResolver();
    }

    public function testMaxDamagePrefersTheMotionAndSimplePrefersTheSimpleInput(): void
    {
        $hadoken = $this->move('236HP', '236H', '6SP', 80);

        $classic = $this->resolver->resolve($hadoken, ComboExecutionMode::CLASSIC);
        $max = $this->resolver->resolve($hadoken, ComboExecutionMode::MODERN_MAX);
        $simple = $this->resolver->resolve($hadoken, ComboExecutionMode::MODERN_SIMPLE);

        self::assertSame(['236HP', false, null], [$classic->notation, $classic->simpleInput, $classic->damagePercent]);
        self::assertSame(['236H', false, null], [$max->notation, $max->simpleInput, $max->damagePercent]);
        self::assertSame(['6SP', true, 80], [$simple->notation, $simple->simpleInput, $simple->damagePercent]);
    }

    public function testMissingRepresentationsFallBackToTheNextAvailableExecution(): void
    {
        $simpleOnly = $this->resolver->resolve($this->move('SA1', null, 'SP+A', 80), ComboExecutionMode::MODERN_MAX);
        $motionOnly = $this->resolver->resolve($this->move('5HP', 'H', null, null), ComboExecutionMode::MODERN_SIMPLE);
        $noModernData = $this->resolver->resolve($this->move('2MK', null, null, null), ComboExecutionMode::MODERN_SIMPLE);

        self::assertSame(['SP+A', true, 80], [$simpleOnly->notation, $simpleOnly->simpleInput, $simpleOnly->damagePercent]);
        self::assertSame(['H', false, null], [$motionOnly->notation, $motionOnly->simpleInput, $motionOnly->damagePercent]);
        self::assertSame(['2MK', false, null], [$noModernData->notation, $noModernData->simpleInput, $noModernData->damagePercent]);
    }

    private function move(string $classic, ?string $max, ?string $simple, ?int $simplePercent): Move
    {
        return (new Move())
            ->setCharacter((new Character())->setName('Ryu'))
            ->setNumpadNotation($classic)
            ->setModernMaxNotation($max)
            ->setModernSimpleNotation($simple)
            ->setModernSimpleDamagePercent($simplePercent);
    }
}
