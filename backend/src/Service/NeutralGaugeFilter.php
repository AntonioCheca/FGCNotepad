<?php declare(strict_types=1);

namespace App\Service;

/** Drive / Super (in bars) and Health (raw points) ranges for one side. Null bounds are not filtered. */
final class NeutralGaugeFilter
{
    public const DRIVE_BARS = 6;
    public const SUPER_BARS = 3;
    public const DRIVE_UNITS_PER_BAR = 10000;
    public const SUPER_UNITS_PER_BAR = 10000;

    public function __construct(
        public readonly ?float $driveMin = null,
        public readonly ?float $driveMax = null,
        public readonly ?float $superMin = null,
        public readonly ?float $superMax = null,
        public readonly ?int $healthMin = null,
        public readonly ?int $healthMax = null,
    ) {
    }

    /** @return array<string, float|int|null> */
    public function toArray(): array
    {
        return [
            'driveMin' => $this->driveMin,
            'driveMax' => $this->driveMax,
            'superMin' => $this->superMin,
            'superMax' => $this->superMax,
            'healthMin' => $this->healthMin,
            'healthMax' => $this->healthMax,
        ];
    }
}
