<?php declare(strict_types=1);

namespace App\Service;

class ScenarioMatrixPayloadValidator
{
    /**
     * Validates scenario-table matrix payloads embedded in lexical post JSON.
     *
     * @param array<string, mixed> $body
     *
     * @return list<string>
     */
    public function validateScenarioTables(array $body): array
    {
        $errors = [];
        $this->validateNode($body, $errors, 'root');

        return $errors;
    }

    /**
     * @param array<string, mixed> $node
     * @param list<string>         $errors
     */
    private function validateNode(array $node, array &$errors, string $path): void
    {
        $matrix = $this->normalizeMatrixPayload($node['matrix'] ?? null);
        if (($node['type'] ?? null) === 'scenario-table' && null !== $matrix) {
            $this->validateMatrixPayload($matrix, $errors, $path);
        }

        foreach ($node as $key => $value) {
            if (!is_array($value)) {
                continue;
            }

            if (array_is_list($value)) {
                foreach ($value as $index => $item) {
                    if (is_array($item)) {
                        $this->validateNode($item, $errors, sprintf('%s.%s[%d]', $path, (string) $key, $index));
                    }
                }
                continue;
            }

            $this->validateNode($value, $errors, sprintf('%s.%s', $path, (string) $key));
        }
    }

    /**
     * @param array<string, mixed> $matrix
     * @param list<string>         $errors
     */
    private function validateMatrixPayload(array $matrix, array &$errors, string $path): void
    {
        $cells = $matrix['cells'] ?? null;
        if (!is_array($cells)) {
            return;
        }

        foreach ($cells as $rowIndex => $row) {
            if (!is_array($row)) {
                continue;
            }

            foreach ($row as $columnIndex => $cell) {
                if (!is_array($cell) || ($cell['cellType'] ?? null) !== 'dynamic_combo') {
                    continue;
                }

                $cellPath = sprintf('%s.matrix.cells[%d][%d]', $path, $rowIndex, $columnIndex);
                $this->validateDynamicComboCell($cell, $errors, $cellPath);
            }
        }
    }

    /**
     * @param array<string, mixed> $cell
     * @param list<string>         $errors
     */
    private function validateDynamicComboCell(array $cell, array &$errors, string $cellPath): void
    {
        $dynamicCombo = $cell['dynamicCombo'] ?? null;
        if (!is_array($dynamicCombo)) {
            $errors[] = sprintf('%s.dynamicCombo is required for dynamic_combo cells.', $cellPath);

            return;
        }

        $attackerCharacterId = $dynamicCombo['attackerCharacterId'] ?? null;
        if (!is_string($attackerCharacterId) || '' === trim($attackerCharacterId)) {
            $errors[] = sprintf('%s.dynamicCombo.attackerCharacterId must be a non-empty string.', $cellPath);
        }

        $starterMoveIds = $dynamicCombo['starterMoveIds'] ?? null;
        if (!is_array($starterMoveIds)) {
            $errors[] = sprintf('%s.dynamicCombo.starterMoveIds must be a non-empty array.', $cellPath);
        } else {
            $normalizedStarterMoveIds = array_values(array_filter(
                $starterMoveIds,
                static fn (mixed $starterMoveId): bool => is_string($starterMoveId) && '' !== trim($starterMoveId)
            ));

            if ([] === $normalizedStarterMoveIds) {
                $errors[] = sprintf('%s.dynamicCombo.starterMoveIds must contain at least one move id.', $cellPath);
            }
        }

        $starterContext = $dynamicCombo['starterContext'] ?? null;
        if (!is_array($starterContext)) {
            $errors[] = sprintf('%s.dynamicCombo.starterContext is required.', $cellPath);

            return;
        }

        $hasPunishCounter = $starterContext['isPunishCounter'] ?? null;
        $hasCounterHit = $starterContext['isCounterHit'] ?? null;

        if (!is_bool($hasPunishCounter) || !is_bool($hasCounterHit)) {
            $errors[] = sprintf(
                '%s.dynamicCombo.starterContext requires boolean isPunishCounter and isCounterHit values.',
                $cellPath
            );

            return;
        }

        if ($hasPunishCounter && $hasCounterHit) {
            $errors[] = sprintf(
                '%s.dynamicCombo.starterContext cannot set isPunishCounter and isCounterHit to true at the same time.',
                $cellPath
            );
        }
    }

    /**
     * @return array<string, mixed>|null
     */
    private function normalizeMatrixPayload(mixed $matrix): ?array
    {
        if (is_array($matrix)) {
            return $matrix;
        }

        if (!is_string($matrix)) {
            return null;
        }

        $decoded = json_decode($matrix, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
            return null;
        }

        return $decoded;
    }
}
