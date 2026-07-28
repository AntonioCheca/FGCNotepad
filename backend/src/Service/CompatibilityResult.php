<?php declare(strict_types=1);

namespace App\Service;

class CompatibilityResult
{
    public const COMPATIBLE = 'compatible';
    public const INCOMPATIBLE = 'incompatible';
    public const UNCERTAIN = 'uncertain';

    /**
     * @param list<string> $reasons
     * @param list<string> $warnings
     */
    public function __construct(
        private readonly string $status,
        private readonly array $reasons = [],
        private readonly array $warnings = [],
    ) {
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    /** @return list<string> */
    public function getReasons(): array
    {
        return $this->reasons;
    }

    /** @return list<string> */
    public function getWarnings(): array
    {
        return $this->warnings;
    }

    /** @return array{status:string,reasons:list<string>,warnings:list<string>} */
    public function toArray(): array
    {
        return [
            'status' => $this->status,
            'reasons' => $this->reasons,
            'warnings' => $this->warnings,
        ];
    }
}
