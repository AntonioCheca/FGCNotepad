<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ComboSequences;

final class ComboSearchResult
{
    /**
     * @param list<ComboSequences> $items
     * @param array<int, array<string, mixed>> $compatibilityByComboId
     */
    public function __construct(
        public readonly array $items,
        public readonly int $total,
        public readonly array $compatibilityByComboId = [],
    ) {
    }
}
