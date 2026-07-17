<?php declare(strict_types=1);

namespace App;

use Symfony\Bundle\FrameworkBundle\Kernel\MicroKernelTrait;
use Symfony\Component\DependencyInjection\Compiler\CompilerPassInterface;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\HttpKernel\Kernel as BaseKernel;

class Kernel extends BaseKernel
{
    use MicroKernelTrait;

    public function __construct(string $environment, bool $debug)
    {
        if ('prod' === $environment && $this->isTruthyEnvValue('DISABLE_JWT')) {
            throw new \LogicException('DISABLE_JWT=true is not allowed in production.');
        }

        parent::__construct($environment, $debug);
    }

    protected function build(ContainerBuilder $container): void
    {
        parent::build($container);

        if ('test' !== $this->environment) {
            return;
        }

        $container->addCompilerPass(new class implements CompilerPassInterface {
            public function process(ContainerBuilder $container): void
            {
                if ($container->hasDefinition('doctrine')) {
                    $container->getDefinition('doctrine')->clearTag('kernel.reset');
                }
            }
        });
    }

    private function isTruthyEnvValue(string $name): bool
    {
        $values = [$_SERVER[$name] ?? null, $_ENV[$name] ?? null, getenv($name)];

        foreach ($values as $value) {
            if (false === $value || null === $value) {
                continue;
            }

            if (in_array(strtolower((string) $value), ['1', 'true', 'yes', 'on'], true)) {
                return true;
            }
        }

        return false;
    }
}
