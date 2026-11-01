<?php declare(strict_types=1);

namespace App\Service\ScenarioTransfer;

use App\Entity\ScenarioCell;
use App\Entity\ScenarioComboContext;

/**
 * Shared vocabulary of the scenario_export_v1 format (docs/scenario-export/scenario_export_v1.schema.json).
 */
final class ScenarioExportFormat
{
    public const FORMAT = 'scenario_export_v1';

    /** Key source of scenarios created on this site rather than imported; their externalId is the scenario public id. */
    public const SITE_SOURCE = 'fgcnotepad';

    public const SCENARIO_TYPES = ['oki', 'blockstring', 'aggregated_oki'];
    public const POSITIONS = [
        ScenarioComboContext::POSITION_VIEWER_DEFAULT_MIDSCREEN,
        ScenarioComboContext::POSITION_MIDSCREEN,
        ScenarioComboContext::POSITION_CORNER,
    ];
    public const HIT_CONDITIONS = ['normal', 'counter_hit', 'punish_counter', 'perfect_parry'];
    public const INITIATORS = ['attacker', 'defender'];
    public const REFERENCE_MODES = ['reference', 'computed'];
    public const REFERENCE_PERSPECTIVES = ScenarioCell::PERSPECTIVES;
    public const REQUIREMENT_OWNERS = ['attacker', 'defender'];
    public const REQUIREMENT_RESOURCES = ['health', 'drive', 'super'];

    /**
     * Deterministic axis keys derived from labels, so an export, re-import and second export produce the same keys.
     *
     * @param list<string> $labels
     *
     * @return list<string>
     */
    public static function axisKeys(array $labels, string $fallbackPrefix): array
    {
        $keys = [];
        $used = [];
        foreach ($labels as $index => $label) {
            $base = trim((string) preg_replace('/[^a-z0-9]+/', '-', mb_strtolower($label)), '-');
            if ('' === $base) {
                $base = sprintf('%s-%d', $fallbackPrefix, $index + 1);
            }

            $key = $base;
            for ($suffix = 2; isset($used[$key]); ++$suffix) {
                $key = sprintf('%s-%d', $base, $suffix);
            }

            $used[$key] = true;
            $keys[] = $key;
        }

        return $keys;
    }

    /**
     * A reference cell's exported shape. Weight and perspective are left out at their defaults (1, same side), so
     * plain references export as before.
     *
     * @param array{source:string,externalId:string}|null $scenario
     * @param array<string, mixed>|null $preValue
     *
     * @return array<string, mixed>
     */
    public static function referencePayload(?array $scenario, string $mode, float $weight, string $perspective, ?float $cachedValue, ?array $preValue): array
    {
        return ['scenario' => $scenario, 'mode' => $mode]
            + (1.0 === $weight ? [] : ['weight' => $weight])
            + (ScenarioCell::PERSPECTIVE_SAME === $perspective ? [] : ['perspective' => $perspective])
            + ['cachedValue' => $cachedValue, 'preValue' => $preValue];
    }

    /**
     * Hash of the authored content. A reference cell's cachedValue is left out: the site recomputes it whenever a
     * scenario in its linked component changes, which is not an edit of this scenario.
     *
     * @param array<string, mixed> $scenarioPayload one entry of the document's scenarios list
     */
    public static function contentHash(array $scenarioPayload): string
    {
        if (is_array($scenarioPayload['cells'] ?? null)) {
            foreach ($scenarioPayload['cells'] as $index => $cell) {
                if (is_array($cell) && is_array($cell['reference'] ?? null)) {
                    unset($scenarioPayload['cells'][$index]['reference']['cachedValue']);
                }
            }
        }

        return hash('sha256', json_encode($scenarioPayload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }
}
