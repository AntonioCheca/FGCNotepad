<?php declare(strict_types=1);

namespace App\Service\ReplayStorage;

interface LocalVideoPathResolver
{
    public function resolvePath(string $storageKey): string;
}
