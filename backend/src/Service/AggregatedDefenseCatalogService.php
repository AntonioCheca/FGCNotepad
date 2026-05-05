<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Character;

class AggregatedDefenseCatalogService
{
    /**
     * @var list<array{key:string,label:string}>
     */
    private const DEFENSE_CATALOG = [
        ['key' => 'block', 'label' => 'Block'],
        ['key' => 'mash_4f', 'label' => 'Mash 4f'],
        ['key' => 'invincible_reversal_fast', 'label' => 'Invincible Reversal Fast'],
        ['key' => 'invincible_reversal_slow', 'label' => 'Invincible Reversal Slow'],
        ['key' => 'invincible_super', 'label' => 'Invincible Super'],
        ['key' => 'backdash', 'label' => 'Backdash'],
        ['key' => 'delay_tech', 'label' => 'Delay Tech'],
        ['key' => 'perfect_parry', 'label' => 'Perfect Parry'],
        ['key' => 'no_invincible_option', 'label' => 'No Invincible Option'],
    ];

    /**
     * @var array<string, array<string, bool>>
     */
    private const CHARACTER_OVERRIDES = [
        'dhalsim' => [
            'invincible_reversal_fast' => false,
            'invincible_reversal_slow' => false,
            'invincible_super' => true,
            'no_invincible_option' => false,
        ],
        'marisa' => [
            'invincible_reversal_fast' => false,
            'invincible_reversal_slow' => false,
            'invincible_super' => true,
            'no_invincible_option' => false,
        ],
        'ed' => [
            'invincible_reversal_fast' => false,
            'invincible_reversal_slow' => true,
            'invincible_super' => true,
            'no_invincible_option' => false,
        ],
    ];

    public function isAggregatedScenarioType(string $scenarioType): bool
    {
        return 'aggregated_oki' === trim(mb_strtolower($scenarioType));
    }

    /**
     * @return list<array{key:string,label:string}>
     */
    public function catalog(): array
    {
        return self::DEFENSE_CATALOG;
    }

    /**
     * @return list<string>
     */
    public function columnLabels(): array
    {
        return array_map(static fn (array $entry): string => $entry['label'], self::DEFENSE_CATALOG);
    }

    /**
     * @return array<string, bool>
     */
    public function capabilitiesForCharacter(?Character $character): array
    {
        $capabilities = [
            'block' => true,
            'mash_4f' => true,
            'invincible_reversal_fast' => true,
            'invincible_reversal_slow' => false,
            'invincible_super' => true,
            'backdash' => true,
            'delay_tech' => true,
            'perfect_parry' => true,
            'no_invincible_option' => false,
        ];

        if (null === $character) {
            return $capabilities;
        }

        $nameKey = trim(mb_strtolower($character->getName()));
        if ('' === $nameKey) {
            return $capabilities;
        }

        $override = self::CHARACTER_OVERRIDES[$nameKey] ?? [];
        foreach ($override as $capabilityKey => $enabled) {
            $capabilities[$capabilityKey] = $enabled;
        }

        return $capabilities;
    }

    /**
     * @param array<string, mixed> $matrix
     *
     * @return array<string, mixed>
     */
    public function normalizeAggregatedMatrix(array $matrix): array
    {
        $axes = is_array($matrix['axes'] ?? null) ? $matrix['axes'] : [];
        $rows = is_array($axes['rows'] ?? null) ? $axes['rows'] : [];
        $rowLayers = is_array($axes['rowLayers'] ?? null) ? $axes['rowLayers'] : [];
        $rowRequirements = is_array($axes['rowRequirements'] ?? null) ? $axes['rowRequirements'] : [];
        $sourceColumnRequirements = is_array($axes['columnRequirements'] ?? null) ? $axes['columnRequirements'] : [];
        $columns = $this->columnLabels();

        $cells = is_array($matrix['cells'] ?? null) ? $matrix['cells'] : [];
        $summary = is_array($matrix['summary'] ?? null) ? $matrix['summary'] : [];
        $rowAxis = is_array($summary['rowAxis'] ?? null) ? $summary['rowAxis'] : [];
        $columnAxis = is_array($summary['columnAxis'] ?? null) ? $summary['columnAxis'] : [];

        $normalizedCells = [];
        foreach ($rows as $rowIndex => $_rowLabel) {
            $sourceRow = is_array($cells[$rowIndex] ?? null) ? $cells[$rowIndex] : [];
            $normalizedRow = [];

            foreach ($columns as $columnIndex => $_columnLabel) {
                $sourceCell = $sourceRow[$columnIndex] ?? null;
                $normalizedRow[] = is_array($sourceCell)
                    ? $sourceCell
                    : ['cellType' => 'value', 'dataType' => 'empty', 'value' => null];
            }

            $normalizedCells[] = $normalizedRow;
        }

        $normalizedColumnAxis = [];
        foreach ($columns as $columnIndex => $_columnLabel) {
            $sourceSummary = $columnAxis[$columnIndex] ?? null;
            $normalizedColumnAxis[] = is_array($sourceSummary)
                ? $sourceSummary
                : ['cellType' => 'summary', 'dataType' => 'empty', 'value' => null];
        }

        return array_merge($matrix, [
            'axes' => [
                'rows' => $rows,
                'columns' => $columns,
                'rowLayers' => $rowLayers,
                'columnLayers' => array_fill(0, count($columns), 1),
                'rowRequirements' => $rowRequirements,
                'columnRequirements' => array_map(
                    static fn (int $index): array => is_array($sourceColumnRequirements[$index] ?? null) ? $sourceColumnRequirements[$index] : [],
                    array_keys($columns)
                ),
            ],
            'cells' => $normalizedCells,
            'summary' => array_merge($summary, [
                'rowAxis' => $rowAxis,
                'columnAxis' => $normalizedColumnAxis,
            ]),
        ]);
    }
}
