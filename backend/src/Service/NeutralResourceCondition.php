<?php declare(strict_types=1);

namespace App\Service;

/** A resolved resource filter: accepted exact values of one side's resource (or install state as 0/1). */
final class NeutralResourceCondition
{
    /** @param list<int> $values */
    public function __construct(
        public readonly string $side,
        public readonly string $sourceKey,
        public readonly bool $isInstall,
        public readonly array $values,
    ) {
    }
}
