<?php declare(strict_types=1);

namespace App\Service\ScenarioTransfer;

use App\Entity\ScenarioCell;
use App\Entity\ScenarioComboContext;
use App\Service\AggregatedDefenseCatalogService;

/**
 * Structural validation of a scenario_export_v1 document, mirroring docs/scenario-export/scenario_export_v1.schema.json.
 * Needs no database: catalog lookups (characters, moves, resources, referenced scenarios) happen in ScenarioImportResolver.
 *
 * @phpstan-type ParsedStarter array{initiator:string,moves:list<string>,hitCondition:string}
 * @phpstan-type ParsedKey array{source:string,externalId:string}
 * @phpstan-type ParsedAxisItem array{key:string,label:string,description:string|null,layer:int,requirements:list<array{owner:string,resource:string,threshold:float}>,summaryValue:float|null,stats:array{seenFrequency:float,sampleCount:int|null}|null}
 * @phpstan-type ParsedCell array{path:string,row:string,column:string,kind:string,value:float|null,starter:ParsedStarter|null,reference:array{scenario:ParsedKey,mode:string,weight:float,perspective:string,cachedValue:float|null,preValue:array{kind:string,value:float|null,starter:ParsedStarter|null}|null}|null,provenance:array{status:string,sampleCount:int|null,confidence:float|null,note:string|null}|null}
 * @phpstan-type ParsedScenario array{path:string,key:ParsedKey,name:string,scenarioType:string,isEssential:bool,attacker:string,defender:string,situation:array{triggerMove:array{character:string,notation:string},position:string,knockdownAdvantage:int|null,characterStatuses:list<array{object:string,status:string|int|bool}>},rows:list<ParsedAxisItem>,columns:list<ParsedAxisItem>,cells:array<int,array<int,ParsedCell>>}
 */
final class ScenarioImportDocumentValidator
{
    private const SOURCE_PATTERN = '/^[a-z0-9][a-z0-9_.-]{0,63}$/';
    private const AXIS_KEY_PATTERN = '/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,79}$/';
    private const MAX_EXTERNAL_ID_LENGTH = 191;
    private const MAX_LABEL_LENGTH = 200;
    private const MAX_DESCRIPTION_LENGTH = 2000;

    /** @var list<string> */
    private array $errors = [];

    public function __construct(
        private readonly AggregatedDefenseCatalogService $aggregatedDefenseCatalogService,
    ) {
    }

    /**
     * @param array<mixed> $document
     *
     * @return array{errors:list<string>,scenarios:list<ParsedScenario>}
     */
    public function validate(array $document): array
    {
        $this->errors = [];
        $this->assertKnownKeys($document, ['$schema', 'format', 'exportedAt', 'generator', 'scenarios'], '');

        if (ScenarioExportFormat::FORMAT !== ($document['format'] ?? null)) {
            $this->errors[] = sprintf('format: must be "%s".', ScenarioExportFormat::FORMAT);
        }

        $scenarios = $document['scenarios'] ?? null;
        if (!is_array($scenarios) || !array_is_list($scenarios) || [] === $scenarios) {
            $this->errors[] = 'scenarios: must be a non-empty array.';

            return ['errors' => $this->errors, 'scenarios' => []];
        }

        $parsed = [];
        $seenKeys = [];
        foreach ($scenarios as $index => $scenario) {
            $path = sprintf('scenarios[%d]', $index);
            if (!is_array($scenario)) {
                $this->errors[] = sprintf('%s: must be an object.', $path);
                continue;
            }

            $result = $this->parseScenario($scenario, $path);
            if (null === $result) {
                continue;
            }

            $identity = $result['key']['source'] . "\n" . $result['key']['externalId'];
            if (isset($seenKeys[$identity])) {
                $this->errors[] = sprintf('%s.key: duplicates %s.key.', $path, $seenKeys[$identity]);
                continue;
            }

            $seenKeys[$identity] = $path;
            $parsed[] = $result;
        }

        return ['errors' => $this->errors, 'scenarios' => [] === $this->errors ? $parsed : []];
    }

    /**
     * @param array<mixed> $data
     *
     * @return ParsedScenario|null
     */
    private function parseScenario(array $data, string $path): ?array
    {
        $errorCount = count($this->errors);
        $this->assertKnownKeys($data, ['key', 'name', 'scenarioType', 'isEssential', 'attacker', 'defender', 'situation', 'rows', 'columns', 'cells'], $path);

        $key = $this->parseKey($data['key'] ?? null, $path . '.key');
        $name = $this->requireString($data, 'name', $path, self::MAX_LABEL_LENGTH);
        $scenarioType = $this->requireEnum($data, 'scenarioType', ScenarioExportFormat::SCENARIO_TYPES, $path, null);
        $isEssential = $this->optionalBool($data, 'isEssential', $path) ?? false;
        $attacker = $this->requireString($data, 'attacker', $path, 64);
        $defender = $this->requireString($data, 'defender', $path, 64);
        $situation = $this->parseSituation($data['situation'] ?? null, $path . '.situation', $attacker);
        $rows = $this->parseAxis($data['rows'] ?? null, $path . '.rows');
        $columns = $this->parseAxis($data['columns'] ?? null, $path . '.columns');

        if (count($this->errors) > $errorCount || null === $key || null === $situation || null === $rows || null === $columns) {
            return null;
        }

        if ('aggregated_oki' === $scenarioType) {
            $this->assertAggregatedColumns($columns, $path . '.columns');
        }

        $cells = $this->parseCells($data['cells'] ?? null, $path . '.cells', $rows, $columns);
        if (count($this->errors) > $errorCount || null === $cells) {
            return null;
        }

        return [
            'path' => $path,
            'key' => $key,
            'name' => (string) $name,
            'scenarioType' => (string) $scenarioType,
            'isEssential' => $isEssential,
            'attacker' => (string) $attacker,
            'defender' => (string) $defender,
            'situation' => $situation,
            'rows' => $rows,
            'columns' => $columns,
            'cells' => $cells,
        ];
    }

    /**
     * @return ParsedKey|null
     */
    private function parseKey(mixed $value, string $path): ?array
    {
        if (!is_array($value)) {
            $this->errors[] = sprintf('%s: must be an object with source and externalId.', $path);

            return null;
        }

        $this->assertKnownKeys($value, ['source', 'externalId'], $path);
        $source = $value['source'] ?? null;
        $externalId = $value['externalId'] ?? null;
        $valid = true;
        if (!is_string($source) || 1 !== preg_match(self::SOURCE_PATTERN, $source)) {
            $this->errors[] = sprintf('%s.source: must match %s.', $path, self::SOURCE_PATTERN);
            $valid = false;
        }
        if (!is_string($externalId) || '' === trim($externalId) || mb_strlen($externalId) > self::MAX_EXTERNAL_ID_LENGTH || $externalId !== trim($externalId)) {
            $this->errors[] = sprintf('%s.externalId: must be a trimmed, non-empty string of at most %d characters.', $path, self::MAX_EXTERNAL_ID_LENGTH);
            $valid = false;
        }

        return $valid ? ['source' => (string) $source, 'externalId' => (string) $externalId] : null;
    }

    /**
     * @return array{triggerMove:array{character:string,notation:string},position:string,knockdownAdvantage:int|null,characterStatuses:list<array{object:string,status:string|int|bool}>}|null
     */
    private function parseSituation(mixed $value, string $path, ?string $attacker): ?array
    {
        if (!is_array($value)) {
            $this->errors[] = sprintf('%s: must be an object.', $path);

            return null;
        }

        $this->assertKnownKeys($value, ['triggerMove', 'position', 'knockdownAdvantage', 'characterStatuses'], $path);
        $errorCount = count($this->errors);

        $triggerMove = $value['triggerMove'] ?? null;
        $triggerCharacter = $attacker;
        $triggerNotation = null;
        if (!is_array($triggerMove)) {
            $this->errors[] = sprintf('%s.triggerMove: must be an object with notation.', $path);
        } else {
            $this->assertKnownKeys($triggerMove, ['character', 'notation'], $path . '.triggerMove');
            if (array_key_exists('character', $triggerMove)) {
                $triggerCharacter = $this->requireString($triggerMove, 'character', $path . '.triggerMove', 64);
            }
            $triggerNotation = $this->requireString($triggerMove, 'notation', $path . '.triggerMove', 64);
        }

        $position = $this->requireEnum($value, 'position', ScenarioExportFormat::POSITIONS, $path, ScenarioComboContext::POSITION_VIEWER_DEFAULT_MIDSCREEN);

        $knockdownAdvantage = $value['knockdownAdvantage'] ?? null;
        if (null !== $knockdownAdvantage && (!is_int($knockdownAdvantage) || $knockdownAdvantage < -100 || $knockdownAdvantage > 300)) {
            $this->errors[] = sprintf('%s.knockdownAdvantage: must be an integer frame count or null.', $path);
        }

        $statuses = [];
        $statusPayload = $value['characterStatuses'] ?? [];
        if (!is_array($statusPayload) || !array_is_list($statusPayload)) {
            $this->errors[] = sprintf('%s.characterStatuses: must be an array.', $path);
        } else {
            foreach ($statusPayload as $index => $status) {
                $statusPath = sprintf('%s.characterStatuses[%d]', $path, $index);
                if (!is_array($status)) {
                    $this->errors[] = sprintf('%s: must be an object.', $statusPath);
                    continue;
                }
                $this->assertKnownKeys($status, ['object', 'status'], $statusPath);
                $object = $this->requireString($status, 'object', $statusPath, 128);
                $statusValue = $status['status'] ?? null;
                if (!is_string($statusValue) && !is_int($statusValue) && !is_bool($statusValue)) {
                    $this->errors[] = sprintf('%s.status: must be a string, integer or boolean.', $statusPath);
                    continue;
                }
                if (null !== $object) {
                    $statuses[] = ['object' => $object, 'status' => $statusValue];
                }
            }
        }

        if (count($this->errors) > $errorCount || null === $triggerCharacter || null === $triggerNotation || null === $position) {
            return null;
        }

        return [
            'triggerMove' => ['character' => $triggerCharacter, 'notation' => $triggerNotation],
            'position' => $position,
            'knockdownAdvantage' => $knockdownAdvantage,
            'characterStatuses' => $statuses,
        ];
    }

    /**
     * @return list<ParsedAxisItem>|null
     */
    private function parseAxis(mixed $value, string $path): ?array
    {
        if (!is_array($value) || !array_is_list($value) || [] === $value) {
            $this->errors[] = sprintf('%s: must be a non-empty array.', $path);

            return null;
        }

        $errorCount = count($this->errors);
        $items = [];
        $seenKeys = [];
        foreach ($value as $index => $item) {
            $itemPath = sprintf('%s[%d]', $path, $index);
            if (!is_array($item)) {
                $this->errors[] = sprintf('%s: must be an object.', $itemPath);
                continue;
            }

            $this->assertKnownKeys($item, ['key', 'label', 'description', 'layer', 'requirements', 'summaryValue', 'stats'], $itemPath);
            $key = $item['key'] ?? null;
            if (!is_string($key) || 1 !== preg_match(self::AXIS_KEY_PATTERN, $key)) {
                $this->errors[] = sprintf('%s.key: must match %s.', $itemPath, self::AXIS_KEY_PATTERN);
                continue;
            }
            if (isset($seenKeys[$key])) {
                $this->errors[] = sprintf('%s.key: "%s" is used twice.', $itemPath, $key);
                continue;
            }
            $seenKeys[$key] = true;

            $label = $this->requireString($item, 'label', $itemPath, self::MAX_LABEL_LENGTH);
            $description = $this->optionalString($item, 'description', $itemPath, self::MAX_DESCRIPTION_LENGTH);
            $layer = $item['layer'] ?? 1;
            if (!is_int($layer) || $layer < 1 || $layer > 50) {
                $this->errors[] = sprintf('%s.layer: must be an integer from 1 to 50.', $itemPath);
                continue;
            }

            $items[] = [
                'key' => $key,
                'label' => (string) $label,
                'description' => $description,
                'layer' => $layer,
                'requirements' => $this->parseRequirements($item['requirements'] ?? [], $itemPath . '.requirements'),
                'summaryValue' => $this->optionalNumber($item, 'summaryValue', $itemPath),
                'stats' => array_key_exists('stats', $item) && null !== $item['stats'] ? $this->parseSeenStats($item['stats'], $itemPath . '.stats') : null,
            ];
        }

        if (count($this->errors) === $errorCount && !in_array(1, array_column($items, 'layer'), true)) {
            $this->errors[] = sprintf('%s: at least one entry must be on layer 1.', $path);
        }

        return count($this->errors) > $errorCount ? null : $items;
    }

    /**
     * @return list<array{owner:string,resource:string,threshold:float}>
     */
    private function parseRequirements(mixed $value, string $path): array
    {
        if (!is_array($value) || !array_is_list($value)) {
            $this->errors[] = sprintf('%s: must be an array.', $path);

            return [];
        }

        $requirements = [];
        foreach ($value as $index => $requirement) {
            $requirementPath = sprintf('%s[%d]', $path, $index);
            if (!is_array($requirement)) {
                $this->errors[] = sprintf('%s: must be an object.', $requirementPath);
                continue;
            }

            $this->assertKnownKeys($requirement, ['owner', 'resource', 'threshold'], $requirementPath);
            $owner = $this->requireEnum($requirement, 'owner', ScenarioExportFormat::REQUIREMENT_OWNERS, $requirementPath, null);
            $resource = $this->requireEnum($requirement, 'resource', ScenarioExportFormat::REQUIREMENT_RESOURCES, $requirementPath, null);
            $threshold = $requirement['threshold'] ?? null;
            if ((!is_int($threshold) && !is_float($threshold)) || $threshold < 0) {
                $this->errors[] = sprintf('%s.threshold: must be a non-negative number.', $requirementPath);
                continue;
            }
            if (in_array($resource, ['health', 'super'], true) && floor((float) $threshold) !== (float) $threshold) {
                $this->errors[] = sprintf('%s.threshold: must be an integer for %s.', $requirementPath, $resource);
                continue;
            }
            if (null !== $owner && null !== $resource) {
                $requirements[] = ['owner' => $owner, 'resource' => $resource, 'threshold' => (float) $threshold];
            }
        }

        return $requirements;
    }

    /**
     * @param list<ParsedAxisItem> $columns
     */
    private function assertAggregatedColumns(array $columns, string $path): void
    {
        $expected = array_column($this->aggregatedDefenseCatalogService->catalog(), 'label');
        if (array_column($columns, 'label') !== $expected || [1] !== array_values(array_unique(array_column($columns, 'layer')))) {
            $this->errors[] = sprintf('%s: aggregated_oki scenarios use the fixed layer-1 defensive columns, in order: %s.', $path, implode(', ', $expected));
        }
    }

    /**
     * @param list<ParsedAxisItem> $rows
     * @param list<ParsedAxisItem> $columns
     *
     * @return array<int, array<int, ParsedCell>>|null
     */
    private function parseCells(mixed $value, string $path, array $rows, array $columns): ?array
    {
        if (!is_array($value) || !array_is_list($value)) {
            $this->errors[] = sprintf('%s: must be an array.', $path);

            return null;
        }

        $errorCount = count($this->errors);
        $rowIndexes = array_flip(array_column($rows, 'key'));
        $columnIndexes = array_flip(array_column($columns, 'key'));
        $cells = [];
        foreach ($value as $index => $cell) {
            $cellPath = sprintf('%s[%d]', $path, $index);
            if (!is_array($cell)) {
                $this->errors[] = sprintf('%s: must be an object.', $cellPath);
                continue;
            }

            $rowIndex = is_string($cell['row'] ?? null) ? ($rowIndexes[$cell['row']] ?? null) : null;
            $columnIndex = is_string($cell['column'] ?? null) ? ($columnIndexes[$cell['column']] ?? null) : null;
            if (null === $rowIndex || null === $columnIndex) {
                $this->errors[] = sprintf('%s: row and column must name keys declared in rows and columns.', $cellPath);
                continue;
            }
            if (isset($cells[$rowIndex][$columnIndex])) {
                $this->errors[] = sprintf('%s: duplicates the cell for row "%s", column "%s".', $cellPath, $cell['row'], $cell['column']);
                continue;
            }

            $parsed = $this->parseCell($cell, $cellPath);
            if (null !== $parsed) {
                $cells[$rowIndex][$columnIndex] = $parsed;
            }
        }

        if (count($this->errors) > $errorCount) {
            return null;
        }

        foreach ($rows as $rowIndex => $row) {
            foreach ($columns as $columnIndex => $column) {
                if (!isset($cells[$rowIndex][$columnIndex])) {
                    $this->errors[] = sprintf('%s: missing the cell for row "%s", column "%s".', $path, $row['key'], $column['key']);
                }
            }
        }

        return count($this->errors) > $errorCount ? null : $cells;
    }

    /**
     * @param array<mixed> $cell
     *
     * @return ParsedCell|null
     */
    private function parseCell(array $cell, string $path): ?array
    {
        $errorCount = count($this->errors);
        $kind = $this->requireEnum($cell, 'kind', [ScenarioCell::KIND_STATIC, ScenarioCell::KIND_DYNAMIC_COMBO, ScenarioCell::KIND_REFERENCE], $path, null);
        $kindKeys = match ($kind) {
            ScenarioCell::KIND_STATIC => ['value'],
            ScenarioCell::KIND_DYNAMIC_COMBO => ['starter'],
            ScenarioCell::KIND_REFERENCE => ['reference'],
            default => [],
        };
        $this->assertKnownKeys($cell, ['row', 'column', 'kind', 'provenance', ...$kindKeys], $path);

        $parsed = [
            'path' => $path,
            'row' => (string) $cell['row'],
            'column' => (string) $cell['column'],
            'kind' => (string) $kind,
            'value' => ScenarioCell::KIND_STATIC === $kind ? $this->optionalNumber($cell, 'value', $path) : null,
            'starter' => ScenarioCell::KIND_DYNAMIC_COMBO === $kind ? $this->parseStarter($cell['starter'] ?? null, $path . '.starter') : null,
            'reference' => ScenarioCell::KIND_REFERENCE === $kind ? $this->parseReference($cell['reference'] ?? null, $path . '.reference') : null,
            'provenance' => array_key_exists('provenance', $cell) && null !== $cell['provenance'] ? $this->parseProvenance($cell['provenance'], $path . '.provenance') : null,
        ];

        return count($this->errors) > $errorCount ? null : $parsed;
    }

    /**
     * @return ParsedStarter|null
     */
    private function parseStarter(mixed $value, string $path): ?array
    {
        if (!is_array($value)) {
            $this->errors[] = sprintf('%s: must be an object.', $path);

            return null;
        }

        $this->assertKnownKeys($value, ['initiator', 'moves', 'hitCondition'], $path);
        $initiator = $this->requireEnum($value, 'initiator', ScenarioExportFormat::INITIATORS, $path, 'attacker');
        $hitCondition = $this->requireEnum($value, 'hitCondition', ScenarioExportFormat::HIT_CONDITIONS, $path, 'normal');
        $moves = $value['moves'] ?? null;
        $validMoves = is_array($moves) && array_is_list($moves) && [] !== $moves
            && [] === array_filter($moves, static fn (mixed $move): bool => !is_string($move) || '' === trim($move));
        if (!$validMoves) {
            $this->errors[] = sprintf('%s.moves: must be a non-empty array of move notations.', $path);

            return null;
        }
        if (count(array_unique($moves)) !== count($moves)) {
            $this->errors[] = sprintf('%s.moves: must not repeat a notation.', $path);

            return null;
        }

        if (null === $initiator || null === $hitCondition) {
            return null;
        }

        return ['initiator' => $initiator, 'moves' => array_map('trim', $moves), 'hitCondition' => $hitCondition];
    }

    /**
     * @return array{scenario:ParsedKey,mode:string,weight:float,perspective:string,cachedValue:float|null,preValue:array{kind:string,value:float|null,starter:ParsedStarter|null}|null}|null
     */
    private function parseReference(mixed $value, string $path): ?array
    {
        if (!is_array($value)) {
            $this->errors[] = sprintf('%s: must be an object.', $path);

            return null;
        }

        $this->assertKnownKeys($value, ['scenario', 'mode', 'weight', 'perspective', 'cachedValue', 'preValue'], $path);
        $scenario = $this->parseKey($value['scenario'] ?? null, $path . '.scenario');
        $mode = $this->requireEnum($value, 'mode', ScenarioExportFormat::REFERENCE_MODES, $path, 'reference');
        $weight = $this->optionalNumber($value, 'weight', $path) ?? 1.0;
        if ($weight <= 0 || $weight > 1) {
            $this->errors[] = sprintf('%s.weight: must be greater than 0 and at most 1.', $path);
        }
        $perspective = $this->requireEnum($value, 'perspective', ScenarioExportFormat::REFERENCE_PERSPECTIVES, $path, ScenarioCell::PERSPECTIVE_SAME);
        $cachedValue = $this->optionalNumber($value, 'cachedValue', $path);

        $preValue = null;
        $preValuePayload = $value['preValue'] ?? null;
        if (is_array($preValuePayload)) {
            $prePath = $path . '.preValue';
            $preKind = $this->requireEnum($preValuePayload, 'kind', [ScenarioCell::KIND_STATIC, ScenarioCell::KIND_DYNAMIC_COMBO], $prePath, null);
            $this->assertKnownKeys($preValuePayload, ['kind', ScenarioCell::KIND_STATIC === $preKind ? 'value' : 'starter'], $prePath);
            if (ScenarioCell::KIND_STATIC === $preKind) {
                $preNumber = $this->optionalNumber($preValuePayload, 'value', $prePath);
                if (null === $preNumber) {
                    $this->errors[] = sprintf('%s.value: must be a number.', $prePath);
                }
                $preValue = ['kind' => $preKind, 'value' => $preNumber, 'starter' => null];
            } elseif (ScenarioCell::KIND_DYNAMIC_COMBO === $preKind) {
                $preValue = ['kind' => $preKind, 'value' => null, 'starter' => $this->parseStarter($preValuePayload['starter'] ?? null, $prePath . '.starter')];
            }
        } elseif (null !== $preValuePayload) {
            $this->errors[] = sprintf('%s.preValue: must be an object or null.', $path);
        }

        if (null === $scenario || null === $mode || null === $perspective) {
            return null;
        }

        return ['scenario' => $scenario, 'mode' => $mode, 'weight' => $weight, 'perspective' => $perspective, 'cachedValue' => $cachedValue, 'preValue' => $preValue];
    }

    /**
     * @return array{status:string,sampleCount:int|null,confidence:float|null,note:string|null}|null
     */
    private function parseProvenance(mixed $value, string $path): ?array
    {
        if (!is_array($value)) {
            $this->errors[] = sprintf('%s: must be an object or null.', $path);

            return null;
        }

        $this->assertKnownKeys($value, ['status', 'sampleCount', 'confidence', 'note'], $path);
        $status = $this->requireEnum($value, 'status', ScenarioCell::PROVENANCE_STATUSES, $path, null);
        $sampleCount = $value['sampleCount'] ?? null;
        if (null !== $sampleCount && (!is_int($sampleCount) || $sampleCount < 0)) {
            $this->errors[] = sprintf('%s.sampleCount: must be a non-negative integer or null.', $path);
        }
        $confidence = $this->optionalNumber($value, 'confidence', $path);
        if (null !== $confidence && ($confidence < 0 || $confidence > 1)) {
            $this->errors[] = sprintf('%s.confidence: must be between 0 and 1.', $path);
        }
        $note = $this->optionalString($value, 'note', $path, ScenarioCell::PROVENANCE_NOTE_MAX_LENGTH);

        return null === $status ? null : [
            'status' => $status,
            'sampleCount' => is_int($sampleCount) ? $sampleCount : null,
            'confidence' => $confidence,
            'note' => $note,
        ];
    }

    /**
     * @return array{seenFrequency:float,sampleCount:int|null}|null
     */
    private function parseSeenStats(mixed $value, string $path): ?array
    {
        if (!is_array($value)) {
            $this->errors[] = sprintf('%s: must be an object or null.', $path);

            return null;
        }

        $this->assertKnownKeys($value, ['seenFrequency', 'sampleCount'], $path);
        $frequency = $this->optionalNumber($value, 'seenFrequency', $path);
        if (null === $frequency || $frequency < 0 || $frequency > 1) {
            $this->errors[] = sprintf('%s.seenFrequency: must be a number between 0 and 1.', $path);

            return null;
        }
        $sampleCount = $value['sampleCount'] ?? null;
        if (null !== $sampleCount && (!is_int($sampleCount) || $sampleCount < 0)) {
            $this->errors[] = sprintf('%s.sampleCount: must be a non-negative integer or null.', $path);

            return null;
        }

        return ['seenFrequency' => $frequency, 'sampleCount' => $sampleCount];
    }

    /**
     * @param array<mixed> $data
     * @param list<string> $allowed
     */
    private function assertKnownKeys(array $data, array $allowed, string $path): void
    {
        foreach (array_keys($data) as $key) {
            if (!in_array($key, $allowed, true)) {
                $this->errors[] = sprintf('%s: unknown property "%s".', '' === $path ? '(root)' : $path, (string) $key);
            }
        }
    }

    /**
     * @param array<mixed> $data
     */
    private function requireString(array $data, string $field, string $path, int $maxLength): ?string
    {
        $value = $data[$field] ?? null;
        if (!is_string($value) || '' === trim($value) || mb_strlen($value) > $maxLength) {
            $this->errors[] = sprintf('%s.%s: must be a non-empty string of at most %d characters.', $path, $field, $maxLength);

            return null;
        }

        return trim($value);
    }

    /**
     * @param array<mixed> $data
     */
    private function optionalString(array $data, string $field, string $path, int $maxLength): ?string
    {
        $value = $data[$field] ?? null;
        if (null === $value) {
            return null;
        }
        if (!is_string($value) || mb_strlen($value) > $maxLength) {
            $this->errors[] = sprintf('%s.%s: must be a string of at most %d characters, or null.', $path, $field, $maxLength);

            return null;
        }

        return '' === trim($value) ? null : trim($value);
    }

    /**
     * @param array<mixed> $data
     */
    private function optionalNumber(array $data, string $field, string $path): ?float
    {
        $value = $data[$field] ?? null;
        if (null === $value) {
            return null;
        }
        if (!is_int($value) && !is_float($value)) {
            $this->errors[] = sprintf('%s.%s: must be a number or null.', $path, $field);

            return null;
        }

        return (float) $value;
    }

    /**
     * @param array<mixed> $data
     */
    private function optionalBool(array $data, string $field, string $path): ?bool
    {
        $value = $data[$field] ?? null;
        if (null !== $value && !is_bool($value)) {
            $this->errors[] = sprintf('%s.%s: must be a boolean.', $path, $field);

            return null;
        }

        return $value;
    }

    /**
     * @param array<mixed> $data
     * @param list<string> $allowed
     */
    private function requireEnum(array $data, string $field, array $allowed, string $path, ?string $default): ?string
    {
        $value = $data[$field] ?? $default;
        if (!is_string($value) || !in_array($value, $allowed, true)) {
            $this->errors[] = sprintf('%s.%s: must be one of %s.', $path, $field, implode(', ', $allowed));

            return null;
        }

        return $value;
    }
}
