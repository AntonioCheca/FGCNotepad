<?php declare(strict_types=1);

namespace App\Service;

final class FrameDataScalingNormalizationResult
{
    /**
     * @param list<string> $warnings
     */
    public function __construct(
        public readonly ?int $startPercent,
        public readonly ?int $immediatePercent,
        public readonly ?int $minimumPercent,
        public readonly ?int $comboHits,
        public readonly ?int $comboExtraPercent,
        public readonly ?int $multiplierPercent,
        public readonly string $parseStatus,
        public readonly ?string $parseNote,
        public readonly array $warnings,
    ) {
    }
}
