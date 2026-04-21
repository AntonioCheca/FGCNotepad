<?php declare(strict_types=1);

namespace App\Service\ComboImport\Model;

final class ResolvedImportedComboCandidate
{
    /**
     * @param array<int, array{child_sequence_id:int, ordinal_in_combo:int, connection_type_id:int|null, connection_type_name:string|null, token:string}> $steps
     * @param array<int, string> $warnings
     * @param array<int, array{index:int, token:string, normalizedToken:string, code:string, message:string}> $errors
     */
    public function __construct(
        public readonly ImportedComboCandidate $candidate,
        public readonly ?string $normalizedNotation,
        public readonly array $steps,
        public readonly array $warnings,
        public readonly array $errors,
        public readonly string $status,
    ) {
    }

    public function canPersist(): bool
    {
        return 'valid' === $this->status;
    }
}
