<?php declare(strict_types=1);

namespace App\Tests;

use App\Kernel;
use PHPUnit\Framework\TestCase;

final class KernelProductionJwtGuardTest extends TestCase
{
    protected function tearDown(): void
    {
        unset($_ENV['DISABLE_JWT'], $_SERVER['DISABLE_JWT']);
        putenv('DISABLE_JWT');
    }

    public function testProductionCannotBootWithJwtDisabled(): void
    {
        $_ENV['DISABLE_JWT'] = 'true';

        $this->expectException(\LogicException::class);
        $this->expectExceptionMessage('DISABLE_JWT=true is not allowed in production.');

        new Kernel('prod', false);
    }

    public function testDevelopmentCanBootWithJwtDisabled(): void
    {
        $_ENV['DISABLE_JWT'] = 'true';

        $kernel = new Kernel('dev', true);

        self::assertSame('dev', $kernel->getEnvironment());
    }
}
