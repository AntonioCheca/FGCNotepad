<?php declare(strict_types=1);

namespace App\Service;

final class Sf6ComboFrameLengthEstimatorService
{
    /**
     * @param list<array{startup?:int|null,active?:int|null,hitstop?:int|null,recovery?:int|null,connectionTypeName?:string|null}> $moves
     *
     * @return array{totalFrames:int,stepFrames:list<int>,warnings:list<string>}
     */
    public function estimate(array $moves): array
    {
        if ([] === $moves) {
            return ['totalFrames' => 0, 'stepFrames' => [], 'warnings' => []];
        }

        $stepFrames = [];
        $totalFrames = 0;

        foreach ($moves as $index => $move) {
            $startup = $this->readFrameValue($move['startup'] ?? null);
            $active = $this->readFrameValue($move['active'] ?? null);
            $hitstop = $this->readFrameValue($move['hitstop'] ?? null);
            $recovery = $this->readFrameValue($move['recovery'] ?? null);

            $frames = $startup + $active + $hitstop + $recovery;
            if ($index > 0 && $this->connectionSkipsStartup($move['connectionTypeName'] ?? null)) {
                $frames -= $startup;
            }

            $frames = max(0, $frames);
            $stepFrames[] = $frames;
            $totalFrames += $frames;
        }

        return [
            'totalFrames' => $totalFrames,
            'stepFrames' => $stepFrames,
            'warnings' => [],
        ];
    }

    private function connectionSkipsStartup(?string $connectionTypeName): bool
    {
        if (null === $connectionTypeName) {
            return false;
        }

        $normalized = strtolower(trim($connectionTypeName));

        return in_array($normalized, ['chain', 'special', 'special cancel', 'super', 'super cancel', 'target combo'], true);
    }

    private function readFrameValue(mixed $value): int
    {
        return is_int($value) && $value > 0 ? $value : 0;
    }
}
