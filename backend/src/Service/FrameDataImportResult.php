<?php declare(strict_types=1);

namespace App\Service;

final class FrameDataImportResult
{
    /** @var list<string> */
    public array $warnings = [];

    public function __construct(
        public int $processed = 0,
        public int $charactersCreated = 0,
        public int $movesCreated = 0,
        public int $frameDataCreated = 0,
        public int $frameDataUpdated = 0,
        public int $unchanged = 0,
        public int $skipped = 0,
    ) {
    }

    public function addWarning(string $warning): void
    {
        $this->warnings[] = $warning;
    }
}
