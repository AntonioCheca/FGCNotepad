<?php declare(strict_types=1);

namespace App\Service\Modern;

final readonly class MoveExecution
{
    public function __construct(
        public string $notation,
        public bool $simpleInput,
        public ?int $damagePercent,
    ) {
    }
}
