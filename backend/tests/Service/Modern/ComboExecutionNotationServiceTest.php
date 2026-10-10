<?php declare(strict_types=1);

namespace App\Tests\Service\Modern;

use App\Entity\Move;
use App\Service\Modern\ComboExecutionNotationService;
use App\Service\Modern\ModernMoveExecutionResolver;
use App\Util\Enum\ComboExecutionMode;
use PHPUnit\Framework\TestCase;

final class ComboExecutionNotationServiceTest extends TestCase
{
    private ComboExecutionNotationService $service;

    protected function setUp(): void
    {
        $this->service = new ComboExecutionNotationService(new ModernMoveExecutionResolver());
    }

    public function testRawDriveRushIsNotFollowedByAComma(): void
    {
        self::assertSame('DR 6MP, 2MP xx 236HP', $this->notation([['DR', null], ['6MP', 'Link'], ['2MP', 'Link'], ['236HP', 'Special']]));
    }

    public function testMovesAfterOtherMovesKeepTheirCommaSeparator(): void
    {
        self::assertSame('5HP, 2MP', $this->notation([['5HP', null], ['2MP', 'Link']]));
    }

    /** @param list<array{0: string, 1: string|null}> $steps */
    private function notation(array $steps): ?string
    {
        return $this->service->sequenceNotation(
            array_map(static fn (array $step): array => ['move' => (new Move())->setNumpadNotation($step[0]), 'connectionTypeName' => $step[1]], $steps),
            ComboExecutionMode::CLASSIC,
        );
    }
}
